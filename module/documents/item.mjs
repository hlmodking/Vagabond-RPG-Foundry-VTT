/**
 * Extend the base Item document for Vagabond
 */
export class VagabondItem extends Item {

  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications that happen before derived data is calculated
  }

  /** @override */
  prepareDerivedData() {
    const itemData = this;
    const systemData = itemData.system;
    const flags = itemData.flags.vagabond || {};

    // Make separate methods for each Item type
    this._prepareWeaponData(itemData);
    this._prepareArmorData(itemData);
    this._prepareSpellData(itemData);
  }

  /**
   * Prepare Weapon type specific data
   */
  _prepareWeaponData(itemData) {
    if (itemData.type !== 'weapon') return;
    
    const systemData = itemData.system;

    // Determine if weapon can be used with different skills
    systemData.canUseBrawl = systemData.properties.includes('brawl');
    systemData.canUseFinesse = systemData.properties.includes('finesse');
    systemData.canUseRanged = systemData.properties.includes('ranged');

    // Set default attack skill if not set
    if (!systemData.attackSkill) {
      if (systemData.canUseBrawl) systemData.attackSkill = 'brawl';
      else if (systemData.canUseFinesse) systemData.attackSkill = 'finesse';
      else if (systemData.canUseRanged) systemData.attackSkill = 'ranged';
      else systemData.attackSkill = 'melee';
    }
  }

  /**
   * Prepare Armor type specific data
   */
  _prepareArmorData(itemData) {
    if (itemData.type !== 'armor') return;
    
    const systemData = itemData.system;

    // Set armor rating based on type
    const armorRatings = {
      light: 1,
      medium: 2,
      heavy: 3
    };

    if (!systemData.rating && systemData.type) {
      systemData.rating = armorRatings[systemData.type] || 1;
    }

    // Set might requirement based on type
    const mightRequirements = {
      light: 3,
      medium: 4,
      heavy: 5
    };

    if (!systemData.mightReq && systemData.type) {
      systemData.mightReq = mightRequirements[systemData.type] || 3;
    }
  }

  /**
   * Prepare Spell type specific data
   */
  _prepareSpellData(itemData) {
    if (itemData.type !== 'spell') return;
    
    const systemData = itemData.system;

    // Calculate base delivery cost
    const deliveryCosts = {
      touch: 0,
      remote: 0,
      imbue: 0,
      cube: 1,
      aura: 2,
      cone: 2,
      glyph: 2,
      line: 2,
      sphere: 2
    };

    systemData.deliveryCost = deliveryCosts[systemData.delivery] || 0;

    // Determine if spell has damage
    systemData.hasDamage = systemData.damageBase && systemData.damageBase !== "";
  }

  /**
   * Roll weapon damage
   * @param {object} options - Options for the roll
   */
  async rollDamage(options = {}) {
    if (this.type !== 'weapon') return;

    const systemData = this.system;
    const actor = this.actor;

    // Build damage formula
    let formula = systemData.damage.die;
    if (systemData.damage.bonus) {
      formula += ` + ${systemData.damage.bonus}`;
    }

    // Add stat bonus if actor exists
    if (actor) {
      const skill = systemData.attackSkill;
      const skillData = CONFIG.VAGABOND.skills[skill];
      if (skillData) {
        const stat = actor.system.stats[skillData.stat].value;
        formula += ` + ${stat}`;
      }
    }

    // Create roll
    const roll = new Roll(formula);
    await roll.evaluate();

    // Create chat message
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${this.name} - ${game.i18n.localize("VAGABOND.Combat.Damage")}`,
      rolls: [roll]
    };

    // Apply weapon properties
    const properties = [];
    for (const prop of systemData.properties) {
      properties.push(game.i18n.localize(CONFIG.VAGABOND.weaponProperties[prop]));
    }

    if (properties.length > 0) {
      messageData.flavor += ` (${properties.join(', ')})`;
    }

    await ChatMessage.create(messageData);

    return roll;
  }

  /**
   * Cast a spell
   * @param {object} options - Casting options
   */
  async cast(options = {}) {
    if (this.type !== 'spell') return;

    const systemData = this.system;
    const actor = this.actor;

    if (!actor) {
      ui.notifications.warn("This spell must be owned by an actor to cast.");
      return;
    }

    // Check mana
    const manaCost = options.manaCost || systemData.deliveryCost;
    if (actor.system.mana && actor.system.mana.value < manaCost) {
      ui.notifications.warn(game.i18n.localize("VAGABOND.Warnings.NotEnoughMana"));
      return;
    }

    // Build damage roll if applicable
    let damageRoll = null;
    if (systemData.hasDamage && options.dealDamage) {
      const damageDice = options.damageDice || 1;
      const formula = `${damageDice}d6`;
      damageRoll = new Roll(formula);
      await damageRoll.evaluate();
    }

    // Spend mana
    if (actor.system.mana && manaCost > 0) {
      await actor.update({
        'system.mana.value': actor.system.mana.value - manaCost
      });
    }

    // Create chat message
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${this.name} - ${game.i18n.localize("VAGABOND.Magic.Cast")}`,
      content: await foundry.applications.handlebars.renderTemplate("systems/vagabond/templates/chat/spell-cast.hbs", {
        spell: this,
        delivery: game.i18n.localize(CONFIG.VAGABOND.spellDeliveries[systemData.delivery].label),
        manaCost,
        effect: systemData.effect,
        damageRoll
      })
    };

    if (damageRoll) {
      messageData.rolls = [damageRoll];
    }

    await ChatMessage.create(messageData);

    return damageRoll;
  }

  /**
   * Check if prerequisites are met for a perk
   * @param {Actor} actor - The actor to check against
   * @returns {boolean}
   */
  checkPrerequisites(actor) {
    if (this.type !== 'perk') return true;

    const systemData = this.system;
    const prereqs = systemData.prerequisites;

    // Check stat prerequisites
    if (prereqs.stats) {
      for (const [stat, value] of Object.entries(prereqs.stats)) {
        if (actor.system.stats[stat].value < value) {
          return false;
        }
      }
    }

    // Check training prerequisites
    if (prereqs.trained && prereqs.trained.length > 0) {
      for (const skill of prereqs.trained) {
        if (!actor.system.skills[skill]?.trained) {
          return false;
        }
      }
    }

    // Check other prerequisites (items, other perks, etc.)
    if (prereqs.other && prereqs.other.length > 0) {
      // This would need more complex logic based on what "other" means
      // For now, just return true
    }

    return true;
  }

  /**
   * Toggle equipped status
   */
  async toggleEquipped() {
    if (!this.system.equipped === undefined) return;
    
    await this.update({
      'system.equipped': !this.system.equipped
    });
  }

  /**
   * Get the item's properties as a formatted string
   * @returns {string}
   */
  getPropertiesString() {
    if (this.type !== 'weapon') return "";

    const properties = [];
    for (const prop of this.system.properties) {
      properties.push(game.i18n.localize(CONFIG.VAGABOND.weaponProperties[prop]));
    }

    return properties.join(', ');
  }
}
