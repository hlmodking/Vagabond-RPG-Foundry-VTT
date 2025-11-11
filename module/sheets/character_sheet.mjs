/**
 * Character Sheet using ApplicationV2 (Foundry v13)
 */
export class VagabondCharacterSheet extends ActorSheetV2 {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["vagabond", "sheet", "actor", "character"],
    position: {
      width: 720,
      height: 800
    },
    actions: {
      rollCheck: VagabondCharacterSheet._onRollCheck,
      rollDamage: VagabondCharacterSheet._onRollDamage,
      editItem: VagabondCharacterSheet._onEditItem,
      deleteItem: VagabondCharacterSheet._onDeleteItem,
      toggleEquipped: VagabondCharacterSheet._onToggleEquipped,
      rest: VagabondCharacterSheet._onRest,
      breather: VagabondCharacterSheet._onBreather,
      spendLuck: VagabondCharacterSheet._onSpendLuck
    },
    window: {
      resizable: true
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/vagabond/templates/actor/character-sheet-header.hbs"
    },
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    stats: {
      template: "systems/vagabond/templates/actor/character-sheet-stats.hbs"
    },
    skills: {
      template: "systems/vagabond/templates/actor/character-sheet-skills.hbs"
    },
    combat: {
      template: "systems/vagabond/templates/actor/character-sheet-combat.hbs"
    },
    inventory: {
      template: "systems/vagabond/templates/actor/character-sheet-inventory.hbs"
    },
    spells: {
      template: "systems/vagabond/templates/actor/character-sheet-spells.hbs"
    },
    features: {
      template: "systems/vagabond/templates/actor/character-sheet-features.hbs"
    },
    biography: {
      template: "systems/vagabond/templates/actor/character-sheet-biography.hbs"
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
      if (context.items[item.type + 's']) {
        context.items[item.type + 's'].push(itemData);
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
        id: "combat",
        label: "VAGABOND.Tabs.Combat",
        active: this.tabGroups.primary === "combat"
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
        id: "features",
        label: "VAGABOND.Tabs.Features",
        active: this.tabGroups.primary === "features"
      },
      {
        group: "primary",
        id: "biography",
        label: "VAGABOND.Tabs.Biography",
        active: this.tabGroups.primary === "biography"
      }
    ];

    // Add enriched biography
    context.enrichedBiography = await TextEditor.enrichHTML(systemData.biography, {
      async: true,
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
    const data = TextEditor.getDragEventData(event);
    
    if (data.type === 'Item') {
      const item = await fromUuid(data.uuid);
      if (!item) return;
      
      // Create item on this actor
      return this.document.createEmbeddedDocuments('Item', [item.toObject()]);
    }
  }

  /**
   * Roll a check
   */
  static async _onRollCheck(event, target) {
    event.preventDefault();
    const checkType = target.dataset.checkType;
    const checkKey = target.dataset.checkKey;
    
    const actor = this.document;
    
    // Open dialog for Favor/Hinder
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
    if (!item || !item.system.equipped === undefined) return;

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
