/**
 * Character Sheet using ApplicationV2 (Foundry v13) - MANUAL FORM HANDLING
 */

const { HandlebarsApplicationMixin } = foundry.applications.api;

export class VagabondCharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["vagabond", "sheet", "actor", "character"],
    position: {
      width: 800,
      height: 900,
      top: 100,
      left: 200
    },
    actions: {
      rollCheck: VagabondCharacterSheet._onRollCheck,
      rollDamage: VagabondCharacterSheet._onRollDamage,
      editItem: VagabondCharacterSheet._onEditItem,
      deleteItem: VagabondCharacterSheet._onDeleteItem,
      toggleEquipped: VagabondCharacterSheet._onToggleEquipped,
      castSpell: VagabondCharacterSheet._onCastSpell,
      rest: VagabondCharacterSheet._onRest,
      breather: VagabondCharacterSheet._onBreather,
      spendLuck: VagabondCharacterSheet._onSpendLuck,
      editImage: VagabondCharacterSheet._onEditImage,
      toggleEditor: VagabondCharacterSheet._onToggleEditor
    },
    window: {
      title: "Character Sheet",
      resizable: true,
      minimizable: true,
      icon: "fa-solid fa-user"
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    // CRITICAL: Enable drag-drop at the application level
    dragDrop: [{ dragSelector: ".item[data-item-id]", dropSelector: null }]
  };

  /** @override */
  static PARTS = {
    form: {
      template: "systems/vagabond/templates/actor/character-sheet.hbs"
    }
  };

  /** @override */
  tabGroups = {
    primary: "stats"
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const systemData = actor.system;

    context.system = systemData;
    context.config = CONFIG.VAGABOND;
    context.editable = this.isEditable;

    context.items = {
      weapons: [],
      armor: [],
      gear: [],
      spells: [],
      perks: [],
      classes: [],
      ancestries: []
    };

    for (const item of actor.items) {
      const itemData = item.toObject();
      const type = item.type + 's';
      if (context.items[type]) {
        context.items[type].push(itemData);
      }
    }

    context.tabs = [
      {
        group: "primary",
        id: "stats",
        label: "VAGABOND.Tabs.Stats",
        active: this.tabGroups.primary === "stats"
      },
      {
        group: "primary",
        id: "skills",
        label: "VAGABOND.Tabs.Skills",
        active: this.tabGroups.primary === "skills"
      },
      {
        group: "primary",
        id: "inventory",
        label: "VAGABOND.Tabs.Inventory",
        active: this.tabGroups.primary === "inventory"
      },
      {
        group: "primary",
        id: "spells",
        label: "VAGABOND.Tabs.Spells",
        active: this.tabGroups.primary === "spells"
      },
      {
        group: "primary",
        id: "biography",
        label: "VAGABOND.Tabs.Biography",
        active: this.tabGroups.primary === "biography"
      }
    ];

    context.tabGroups = this.tabGroups;

    context.enrichedBiography = await foundry.applications.ux.TextEditor.enrichHTML(systemData.biography, {
      secrets: this.document.isOwner,
      relativeTo: this.document
    });

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    const html = this.element;
    
    // Tab switching
    html.querySelectorAll('.tabs [data-tab]').forEach(tab => {
      tab.addEventListener('click', this._onChangeTab.bind(this));
    });

    // Manual form handling
    const form = html.querySelector('form');
    if (form) {
      let submitTimeout;
      form.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('change', async (e) => {
          clearTimeout(submitTimeout);
          
          submitTimeout = setTimeout(async () => {
            const fieldName = e.target.name;
            if (!fieldName) return;
            
            const updateData = {};
            
            if (e.target.type === 'checkbox') {
              updateData[fieldName] = e.target.checked;
            } else if (e.target.type === 'number') {
              updateData[fieldName] = parseFloat(e.target.value) || 0;
            } else {
              updateData[fieldName] = e.target.value;
            }
            
            try {
              await this.document.update(updateData);
            } catch (error) {
              console.error("Error updating field:", error);
            }
          }, 300);
        });
      });
    }
  }

  _onChangeTab(event) {
    event.preventDefault();
    const newTab = event.currentTarget.dataset.tab;
    
    this.tabGroups.primary = newTab;
    
    const html = this.element;
    
    html.querySelectorAll('.tabs .item').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === newTab);
    });
    
    html.querySelectorAll('.tab').forEach(tab => {
      const isActive = tab.dataset.tab === newTab;
      tab.classList.toggle('active', isActive);
      tab.style.display = isActive ? 'block' : 'none';
    });
  }

  /**
   * Handle drag start - uses Foundry's built-in DragDrop system
   * @override
   */
  _onDragStart(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;

    const dragData = item.toDragData();
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /**
   * Handle drop - uses Foundry's built-in DragDrop system
   * This prevents duplicate creation by properly handling the drop
   * @override
   */
  async _onDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    
    // Handle Item drops
    if (data.type === "Item") {
      return await this._onDropItem(event, data);
    }
    
    // Let parent class handle other drop types
    return super._onDrop(event);
  }

  /**
   * Handle dropping an Item onto the Actor
   * @param {DragEvent} event
   * @param {Object} data
   * @private
   */
  async _onDropItem(event, data) {
    if (!this.document.isOwner) return false;

    const item = await Item.implementation.fromDropData(data);
    
    // Check if the item is already owned by this actor
    if (item.parent?.uuid === this.document.uuid) {
      // Item is already on this actor - just reorder or do nothing
      console.log("Item already on this actor, skipping duplicate creation");
      return false;
    }

    // Create the item on this actor
    const itemData = item.toObject();
    
    // Handle different item types
    return await this._onDropItemCreate(itemData);
  }

  /**
   * Create a new Item on the Actor
   * @param {Object} itemData
   * @private
   */
  async _onDropItemCreate(itemData) {
    // Prevent duplicates by checking if an identical item was just created
    const existingItems = this.document.items.filter(i => 
      i.name === itemData.name && 
      i.type === itemData.type
    );
    
    // If there's already an item with this exact name and type,
    // and it was created in the last second, skip creation
    if (existingItems.length > 0) {
      const mostRecent = existingItems[existingItems.length - 1];
      const timeSinceCreation = Date.now() - mostRecent._stats.createdTime;
      
      if (timeSinceCreation < 1000) {
        console.log("Preventing duplicate item creation");
        return false;
      }
    }

    // Create the item
    return await this.document.createEmbeddedDocuments("Item", [itemData]);
  }

  static _onEditImage(event, target) {
    const current = this.document.img;
    const fp = new foundry.applications.apps.FilePicker({
      type: "image",
      current: current,
      callback: path => {
        this.document.update({img: path});
      }
    });
    fp.render(true);
  }

  static async _onRollCheck(event, target) {
    event.preventDefault();
    const checkType = target.dataset.checkType;
    const checkKey = target.dataset.checkKey;

    const actor = this.document;

    const buttons = {
      normal: {
        label: game.i18n.localize("VAGABOND.Roll.Normal"),
        callback: () => actor.rollCheck(checkType, checkKey, {})
      },
      favor: {
        label: game.i18n.localize("VAGABOND.Roll.Favored"),
        callback: () => actor.rollCheck(checkType, checkKey, { favor: true })
      },
      hinder: {
        label: game.i18n.localize("VAGABOND.Roll.Hindered"),
        callback: () => actor.rollCheck(checkType, checkKey, { hinder: true })
      }
    };

    new Dialog({
      title: game.i18n.localize("VAGABOND.Roll.Title"),
      content: `<p>${game.i18n.localize("VAGABOND.Roll.Prompt")}</p>`,
      buttons,
      default: "normal"
    }).render(true);
  }

  static async _onRollDamage(event, target) {
    event.preventDefault();
    const itemId = target.closest('[data-item-id]')?.dataset.itemId;
    if (!itemId) return;

    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'weapon') return;

    const formula = item.system.damage.die;
    const roll = new Roll(formula);
    await roll.evaluate();

    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      flavor: `${item.name} Damage`,
      rolls: [roll]
    };

    await ChatMessage.create(messageData);
  }

  static _onEditItem(event, target) {
    event.preventDefault();
    const itemId = target.closest('[data-item-id]')?.dataset.itemId;
    if (!itemId) return;

    const item = this.document.items.get(itemId);
    if (item) item.sheet.render(true);
  }

  static async _onDeleteItem(event, target) {
    event.preventDefault();
    const itemId = target.closest('[data-item-id]')?.dataset.itemId;
    if (!itemId) return;

    const item = this.document.items.get(itemId);
    if (!item) return;

    const confirmed = await Dialog.confirm({
      title: game.i18n.format("VAGABOND.DeleteItem", { name: item.name }),
      content: `<p>${game.i18n.localize("VAGABOND.DeleteItemConfirm")}</p>`
    });

    if (confirmed) {
      await item.delete();
    }
  }

  static async _onToggleEquipped(event, target) {
    event.preventDefault();
    const itemId = target.closest('[data-item-id]')?.dataset.itemId;
    if (!itemId) return;

    const item = this.document.items.get(itemId);
    if (!item || item.system.equipped === undefined) return;

    await item.update({ 'system.equipped': !item.system.equipped });
  }

  static async _onCastSpell(event, target) {
    event.preventDefault();
    const itemId = target.closest('[data-item-id]')?.dataset.itemId;
    if (!itemId) return;

    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'spell') return;

    const actor = this.document;
    if (!actor.system.mana || actor.system.mana.max === 0) {
      ui.notifications.warn("This character cannot cast spells (no mana pool).");
      return;
    }

    const deliveryCost = item.system.deliveryCost || 0;
    const hasDamage = item.system.damageBase && item.system.damageBase !== "";
    
    const dialogContent = `
      <form>
        <div class="form-group">
          <label>Delivery Method:</label>
          <select name="delivery">
            <option value="touch" ${item.system.delivery === 'touch' ? 'selected' : ''}>Touch (0 Mana)</option>
            <option value="remote" ${item.system.delivery === 'remote' ? 'selected' : ''}>Remote (0 Mana)</option>
            <option value="imbue" ${item.system.delivery === 'imbue' ? 'selected' : ''}>Imbue (0 Mana)</option>
            <option value="cube" ${item.system.delivery === 'cube' ? 'selected' : ''}>Cube (1 Mana)</option>
            <option value="aura" ${item.system.delivery === 'aura' ? 'selected' : ''}>Aura (2 Mana)</option>
            <option value="cone" ${item.system.delivery === 'cone' ? 'selected' : ''}>Cone (2 Mana)</option>
            <option value="glyph" ${item.system.delivery === 'glyph' ? 'selected' : ''}>Glyph (2 Mana)</option>
            <option value="line" ${item.system.delivery === 'line' ? 'selected' : ''}>Line (2 Mana)</option>
            <option value="sphere" ${item.system.delivery === 'sphere' ? 'selected' : ''}>Sphere (2 Mana)</option>
          </select>
        </div>
        ${hasDamage ? `
        <div class="form-group">
          <label>
            <input type="checkbox" name="dealDamage" checked/>
            Deal Damage
          </label>
        </div>
        <div class="form-group">
          <label>Damage Dice (2 Mana per die):</label>
          <input type="number" name="damageDice" value="1" min="0" max="10"/>
        </div>
        ` : ''}
        <div class="form-group">
          <label>Current Mana: ${actor.system.mana.value} / ${actor.system.mana.max}</label>
        </div>
        <div class="form-group">
          <label>Mana Spend Limit: ${actor.system.mana.spendLimit}</label>
        </div>
      </form>
    `;

    new Dialog({
      title: `Cast ${item.name}`,
      content: dialogContent,
      buttons: {
        cast: {
          icon: '<i class="fas fa-magic"></i>',
          label: "Cast Spell",
          callback: async (html) => {
            const form = html[0].querySelector('form');
            const delivery = form.delivery.value;
            const dealDamage = hasDamage ? form.dealDamage?.checked : false;
            const damageDice = hasDamage && dealDamage ? parseInt(form.damageDice.value) : 0;
            
            const deliveryCosts = {
              touch: 0, remote: 0, imbue: 0,
              cube: 1, aura: 2, cone: 2, glyph: 2, line: 2, sphere: 2
            };
            const manaCost = deliveryCosts[delivery] + (damageDice * 2);
            
            if (manaCost > actor.system.mana.value) {
              ui.notifications.warn(`Not enough mana! Need ${manaCost}, have ${actor.system.mana.value}`);
              return;
            }
            
            if (manaCost > actor.system.mana.spendLimit) {
              ui.notifications.warn(`Exceeds mana spend limit of ${actor.system.mana.spendLimit}!`);
              return;
            }
            
            await item.cast({
              delivery: delivery,
              dealDamage: dealDamage,
              damageDice: damageDice,
              manaCost: manaCost
            });
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "cast"
    }).render(true);
  }

  static async _onRest(event, target) {
    event.preventDefault();
    await this.document.rest(true);
  }

  static async _onBreather(event, target) {
    event.preventDefault();
    await this.document.breather();
  }

  static async _onSpendLuck(event, target) {
    event.preventDefault();
    await this.document.spendLuck(1);
  }

  /**
   * Toggle biography editor - Simple version with backup value system
   */
  static async _onToggleEditor(event, target) {
    event.preventDefault();
    
    const fieldName = target.dataset.target;
    const editorContainer = target.closest('.editor-container');
    const contentDiv = editorContainer.querySelector('.editor-content');
    const button = editorContainer.querySelector('.editor-edit');
    
    const textarea = contentDiv.querySelector('textarea');
    const isEditing = textarea !== null;
    
    if (isEditing) {
      // Save mode - get value with backup fallback
      let newContent = textarea.value;
      if (!newContent && textarea.dataset.backupValue) {
        newContent = textarea.dataset.backupValue;
      }
      
      // Update document
      await this.document.update({ [fieldName]: newContent });
      
      // Enrich and display
      const enriched = await foundry.applications.ux.TextEditor.enrichHTML(newContent, {
        secrets: this.document.isOwner,
        relativeTo: this.document
      });
      
      contentDiv.innerHTML = enriched || '<p class="hint">No biography yet.</p>';
      button.innerHTML = '<i class="fas fa-edit"></i> Edit';
      
    } else {
      // Edit mode - create textarea
      const currentContent = foundry.utils.getProperty(this.document, fieldName) || "";
      
      const textarea = document.createElement('textarea');
      textarea.name = fieldName;
      textarea.rows = 20;
      textarea.style.cssText = 'width: 100%; font-family: monospace; padding: 8px;';
      textarea.value = currentContent;
      
      // Store backup value on every input change
      textarea.addEventListener('input', (e) => {
        e.target.dataset.backupValue = e.target.value;
      });
      
      contentDiv.innerHTML = '';
      contentDiv.appendChild(textarea);
      
      button.innerHTML = '<i class="fas fa-save"></i> Save';
      
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }
}
