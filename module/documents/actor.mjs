/**
 * Extend the base Actor document for Vagabond
 */
export class VagabondActor extends Actor {

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
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.vagabond || {};

    // Make separate methods for each Actor type
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;
    
    const systemData = actorData.system;

    // Calculate Max HP (Might × Level)
    systemData.hp.max = systemData.stats.might.value * systemData.level;
    
    // Calculate Inventory Slots (8 + Might)
    systemData.slots.max = 8 + systemData.stats.might.value;

    // Calculate Speed based on Dexterity
    const dex = systemData.stats.dexterity.value;
    if (dex <= 3) {
      systemData.speed.base = 25;
      systemData.speed.crawl = 75;
      systemData.speed.travel = 5;
    } else if (dex <= 5) {
      systemData.speed.base = 30;
      systemData.speed.crawl = 90;
      systemData.speed.travel = 6;
    } else {
      systemData.speed.base = 35;
      systemData.speed.crawl = 105;
      systemData.speed.travel = 7;
    }

    // Calculate Luck Pool
    systemData.luck.max = systemData.stats.luck.value;

    // Calculate Saves
    // Endure = 20 - (MIT + MIT)
    systemData.saves.endure.value = 20 - (systemData.stats.might.value * 2);
    
    // Reflex = 20 - (DEX + AWR)
    systemData.saves.reflex.value = 20 - (systemData.stats.dexterity.value + systemData.stats.awareness.value);
    
    // Will = 20 - (RSN + PRS)
    systemData.saves.will.value = 20 - (systemData.stats.reason.value + systemData.stats.presence.value);

    // Calculate Mana (if caster)
    if (systemData.mana.max > 0) {
      const level = systemData.level;
      const castingStat = Math.max(systemData.stats.awareness.value, systemData.stats.reason.value);
      systemData.mana.spendLimit = castingStat + Math.ceil(level / 2);
    }
  }

  /**
   * Prepare NPC type specific data
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    const systemData = actorData.system;

    // Calculate Max HP based on HD
    // For simplicity, using average HP: HD × 4.5 (rounded)
    systemData.hp.max = Math.floor(systemData.hd * 4.5);

    // Calculate Saves (simplified for NPCs)
    systemData.saves.endure.value = 20 - (systemData.stats.might.value * 2);
    systemData.saves.reflex.value = 20 - (systemData.stats.dexterity.value + systemData.stats.awareness.value);
    systemData.saves.will.value = 20 - (systemData.stats.reason.value + systemData.stats.presence.value);
  }

  /**
   * Calculate skill difficulty
   * @param {string} skillKey - The skill identifier
   * @returns {number} The difficulty number
   */
  getSkillDifficulty(skillKey) {
    const skill = this.system.skills[skillKey];
    if (!skill) return 20;

    const statValue = this.system.stats[skill.stat].value;
    const multiplier = skill.trained ? 2 : 1;
    return 20 - (statValue * multiplier);
  }

  /**
   * Roll a Check
   * @param {string} type - Type of check ('skill', 'save', 'attack')
   * @param {string} key - The specific key (skill name, save name, etc.)
   * @param {object} options - Additional options
   */
  async rollCheck(type, key, options = {}) {
    let difficulty = 20;
    let label = "";
    let formula = "1d20";

    // Determine difficulty and label based on type
    if (type === 'skill') {
      difficulty = this.getSkillDifficulty(key);
      label = game.i18n.localize(CONFIG.VAGABOND.skills[key].label);
    } else if (type === 'save') {
      difficulty = this.system.saves[key].value;
      label = game.i18n.localize(CONFIG.VAGABOND.saves[key].label);
    } else if (type === 'attack') {
      difficulty = this.getSkillDifficulty(key);
      label = `${game.i18n.localize(CONFIG.VAGABOND.skills[key].label)} Attack`;
    }

    // Apply Favor or Hinder
    if (options.favor && !options.hinder) {
      formula += " + 1d6";
      label += ` (${game.i18n.localize("VAGABOND.Favored")})`;
    } else if (options.hinder && !options.favor) {
      formula += " - 1d6";
      label += ` (${game.i18n.localize("VAGABOND.Hindered")})`;
    }

    // Create the roll
    const roll = new Roll(formula);
    await roll.evaluate();

    // Determine result
    const d20Result = roll.terms[0].results[0].result;
    const total = roll.total;
    
    let resultType = "fail";
    if (d20Result === 20) {
      resultType = "crit";
    } else if (total >= difficulty) {
      resultType = "pass";
    }

    // Create chat message - Let Foundry render the roll, we'll use flavor for our card
    const cardHtml = await foundry.applications.handlebars.renderTemplate("systems/vagabond/templates/chat/check-result.hbs", {
      difficulty,
      total,
      resultType,
      isCrit: d20Result === 20,
      label,
      formula: roll.formula
    });

    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: cardHtml,
      rolls: [roll]
    };

    await ChatMessage.create(messageData);

    return {
      roll,
      total,
      difficulty,
      resultType,
      isCrit: d20Result === 20
    };
  }

  /**
   * Short or long rest for the character
   * @param {boolean} longRest - Whether this is a long rest
   */
  async rest(longRest = false) {
    const systemData = this.system;
    const updates = {};

    if (longRest) {
      // Restore HP to max
      if (systemData.hp.value < systemData.hp.max) {
        updates["system.hp.value"] = systemData.hp.max;
        
        // Remove 1 Fatigue if already at max HP
      } else if (systemData.fatigue > 0) {
        updates["system.fatigue"] = Math.max(0, systemData.fatigue - 1);
      }

      // Restore Luck to max
      updates["system.luck.value"] = systemData.luck.max;

      // Restore Mana to max
      if (systemData.mana) {
        updates["system.mana.value"] = systemData.mana.max;
      }

      ui.notifications.info(`${this.name} has completed a Rest.`);
    }

    // Apply updates
    if (!foundry.utils.isEmpty(updates)) {
      await this.update(updates);
    }
  }

  /**
   * Take a breather
   */
  async breather() {
    const systemData = this.system;
    const mightRegen = systemData.stats.might.value;
    const newHP = Math.min(systemData.hp.value + mightRegen, systemData.hp.max);

    await this.update({
      "system.hp.value": newHP
    });

    ui.notifications.info(`${this.name} takes a Breather and regains ${newHP - systemData.hp.value} HP.`);
  }

  /**
   * Spend Luck
   * @param {number} amount - Amount of luck to spend
   */
  async spendLuck(amount = 1) {
    const systemData = this.system;
    if (systemData.luck.value < amount) {
      ui.notifications.warn("Not enough Luck!");
      return false;
    }

    await this.update({
      "system.luck.value": systemData.luck.value - amount
    });

    return true;
  }
}
