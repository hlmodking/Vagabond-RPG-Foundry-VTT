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
    // Let ActorSheetV2 handle form submission
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
    context.actor = actor;  // Make sure actor is available in template
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
        id: "biography",
        label: "VAGABOND.Tabs.Biography",
        active: this.tabGroups.primary === "biography"
      }
    ];

    context.tabGroups = this.tabGroups;

    // Add enriched biography using the actual v13 API (from deprecation warning)
    context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      systemData.biography || "", 
      {
        secrets: this.document.isOwner,
        relativeTo: this.document,
        async: true
      }
    );

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
   * Handle form submission - Override parent method
   * @override
   */
  async _onSubmitForm(formConfig, event) {
    // In ApplicationV2, we need to get the form from the element
    const form = this.element.querySelector("form");
    
    if (!form) {
      console.error("❌ Could not find form element");
      return;
    }
    
    // Create FormData and process it
    const fd = new foundry.applications.ux.FormDataExtended(form);
    const submitData = foundry.utils.expandObject(fd.object);
    
    console.log("🔵 Form submitted:", submitData);
    
    // Don't update if name is empty string
    if (submitData.name === "") {
      delete submitData.name;
    }
    
    // Update the actor
    if (!foundry.utils.isEmpty(submitData)) {
      try {
        await this.document.update(submitData);
        console.log("✅ Actor updated successfully!");
        
        // Update the name input to show the actual saved value
        if (submitData.name !== undefined) {
          const nameInput = form.querySelector('input[name="name"]');
          if (nameInput) {
            nameInput.value = this.document.name;
          }
        }
      } catch (error) {
        console.error("❌ Error updating actor:", error);
      }
    }
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

    const buttons = [
      {
        action: "normal",
        label: game.i18n.localize("VAGABOND.Roll.Normal"),
        callback: () => actor.rollCheck(checkType, checkKey, {})
      },
      {
        action: "favor",
        label: game.i18n.localize("VAGABOND.Roll.Favored"),
        callback: () => actor.rollCheck(checkType, checkKey, { favor: true })
      },
      {
        action: "hinder",
        label: game.i18n.localize("VAGABOND.Roll.Hindered"),
        callback: () => actor.rollCheck(checkType, checkKey, { hinder: true })
      }
    ];

    foundry.applications.api.DialogV2.prompt({
      window: {
        title: game.i18n.localize("VAGABOND.Roll.Title")
      },
      content: `<p>${game.i18n.localize("VAGABOND.Roll.Prompt")}</p>`,
      buttons,
      default: "normal"
    });
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

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.format("VAGABOND.DeleteItem", { name: item.name })
      },
      content: `<p>${game.i18n.localize("VAGABOND.DeleteItemConfirm")}</p>`,
      rejectClose: false,
      modal: true
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
