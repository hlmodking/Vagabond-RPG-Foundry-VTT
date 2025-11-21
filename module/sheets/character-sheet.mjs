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
      showImage: VagabondCharacterSheet._onShowImage
    },
    window: {
      title: "Character Sheet",
      resizable: true,
      minimizable: true,
      icon: "fa-solid fa-user"
    },
    // Form configuration - let ActorSheetV2 handle it
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
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

    // Add basic context
    context.system = systemData;
    context.config = CONFIG.VAGABOND;
    context.editable = this.isEditable;

    // Organize items by type
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

    // Prepare tabs
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

    // Add enriched biography
    context.enrichedBiography = await foundry.applications.ux.TextEditor.enrichHTML(systemData.biography, {
      secrets: this.document.isOwner,
      relativeTo: this.document
    });

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // Make items draggable
    const html = this.element;
    html.querySelectorAll('.item[data-item-id]').forEach(el => {
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', this._onDragStart.bind(this));
    });

    // Handle item drops
    html.addEventListener('drop', this._onDrop.bind(this));
    html.addEventListener('dragover', ev => ev.preventDefault());

    // Tab switching
    html.querySelectorAll('.tabs [data-tab]').forEach(tab => {
      tab.addEventListener('click', this._onChangeTab.bind(this));
    });

    // MANUAL FIX: Since submitOnChange isn't working, manually wire up input changes
    const form = html.querySelector('form');
    if (form) {
      // Add debounced change handler to all inputs
      let submitTimeout;
      form.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('change', async (e) => {
          // Clear any pending submit
          clearTimeout(submitTimeout);
          
          // Debounce the submit (wait 300ms after last change)
          submitTimeout = setTimeout(async () => {
            const fieldName = e.target.name;
            if (!fieldName) return;
            
            console.log("Updating field:", fieldName, "with value:", e.target.value);
            
            // Only update the specific field that changed
            const updateData = {};
            
            // Handle checkboxes
            if (e.target.type === 'checkbox') {
              updateData[fieldName] = e.target.checked;
            } else if (e.target.type === 'number') {
              updateData[fieldName] = parseFloat(e.target.value) || 0;
            } else {
              updateData[fieldName] = e.target.value;
            }
            
            console.log("Update data:", updateData);
            
            // Update the actor
            try {
              await this.document.update(updateData);
              console.log("Field updated successfully!");
            } catch (error) {
              console.error("Error updating field:", error);
            }
          }, 300);
        });
      });
    }
  }

  /**
   * Handle tab changes
   */
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
   * Handle drag start for items
   */
  _onDragStart(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;

    event.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'Item',
      uuid: item.uuid
    }));
  }

  /**
   * Handle drops
   */
  async _onDrop(event) {
    event.preventDefault();

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      return false;
    }

    if (data.type === 'Item') {
      const item = await fromUuid(data.uuid);
      if (!item) return;

      return this.document.createEmbeddedDocuments('Item', [item.toObject()]);
    }
  }

  /**
   * Show actor/item image
   */
  static _onShowImage(event, target) {
    const img = target.src || this.document.img;
    new ImagePopout(img, {
      title: this.document.name,
      shareable: true
    }).render(true);
  }

  /**
   * Roll a check
   */
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

  /**
   * Roll damage
   */
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

  /**
   * Edit an item
   */
  static _onEditItem(event, target) {
    event.preventDefault();
    const itemId = target.closest('[data-item-id]')?.dataset.itemId;
    if (!itemId) return;

    const item = this.document.items.get(itemId);
    if (item) item.sheet.render(true);
  }

  /**
   * Delete an item
   */
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

  /**
   * Toggle equipped status
   */
  static async _onToggleEquipped(event, target) {
    event.preventDefault();
    const itemId = target.closest('[data-item-id]')?.dataset.itemId;
    if (!itemId) return;

    const item = this.document.items.get(itemId);
    if (!item || item.system.equipped === undefined) return;

    await item.update({ 'system.equipped': !item.system.equipped });
  }

  /**
   * Cast a spell
   */
  static async _onCastSpell(event, target) {
    event.preventDefault();
    const itemId = target.closest('[data-item-id]')?.dataset.itemId;
    if (!itemId) return;

    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'spell') return;

    // Check if actor has mana
    const actor = this.document;
    if (!actor.system.mana || actor.system.mana.max === 0) {
      ui.notifications.warn("This character cannot cast spells (no mana pool).");
      return;
    }

    // Open a dialog to choose casting options
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
            
            // Calculate mana cost
            const deliveryCosts = {
              touch: 0, remote: 0, imbue: 0,
              cube: 1, aura: 2, cone: 2, glyph: 2, line: 2, sphere: 2
            };
            const manaCost = deliveryCosts[delivery] + (damageDice * 2);
            
            // Validate mana
            if (manaCost > actor.system.mana.value) {
              ui.notifications.warn(`Not enough mana! Need ${manaCost}, have ${actor.system.mana.value}`);
              return;
            }
            
            if (manaCost > actor.system.mana.spendLimit) {
              ui.notifications.warn(`Exceeds mana spend limit of ${actor.system.mana.spendLimit}!`);
              return;
            }
            
            // Cast the spell using the item's cast method
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

  /**
   * Take a rest
   */
  static async _onRest(event, target) {
    event.preventDefault();
    await this.document.rest(true);
  }

  /**
   * Take a breather
   */
  static async _onBreather(event, target) {
    event.preventDefault();
    await this.document.breather();
  }

  /**
   * Spend luck
   */
  static async _onSpendLuck(event, target) {
    event.preventDefault();
    await this.document.spendLuck(1);
  }
}
