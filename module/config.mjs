/**
 * Vagabond System Configuration
 */

export const VAGABOND = {};

/**
 * Stats
 */
VAGABOND.stats = {
  might: "VAGABOND.Stats.Might",
  dexterity: "VAGABOND.Stats.Dexterity",
  awareness: "VAGABOND.Stats.Awareness",
  reason: "VAGABOND.Stats.Reason",
  presence: "VAGABOND.Stats.Presence",
  luck: "VAGABOND.Stats.Luck"
};

VAGABOND.statsAbbr = {
  might: "VAGABOND.Stats.MightAbbr",
  dexterity: "VAGABOND.Stats.DexterityAbbr",
  awareness: "VAGABOND.Stats.AwarenessAbbr",
  reason: "VAGABOND.Stats.ReasonAbbr",
  presence: "VAGABOND.Stats.PresenceAbbr",
  luck: "VAGABOND.Stats.LuckAbbr"
};

/**
 * Skills
 */
VAGABOND.skills = {
  melee: {
    label: "VAGABOND.Skills.Melee",
    stat: "might"
  },
  brawl: {
    label: "VAGABOND.Skills.Brawl",
    stat: "might"
  },
  finesse: {
    label: "VAGABOND.Skills.Finesse",
    stat: "dexterity"
  },
  sneak: {
    label: "VAGABOND.Skills.Sneak",
    stat: "dexterity"
  },
  ranged: {
    label: "VAGABOND.Skills.Ranged",
    stat: "awareness"
  },
  detect: {
    label: "VAGABOND.Skills.Detect",
    stat: "awareness"
  },
  mysticism: {
    label: "VAGABOND.Skills.Mysticism",
    stat: "awareness"
  },
  survival: {
    label: "VAGABOND.Skills.Survival",
    stat: "awareness"
  },
  arcana: {
    label: "VAGABOND.Skills.Arcana",
    stat: "reason"
  },
  craft: {
    label: "VAGABOND.Skills.Craft",
    stat: "reason"
  },
  medicine: {
    label: "VAGABOND.Skills.Medicine",
    stat: "reason"
  },
  influence: {
    label: "VAGABOND.Skills.Influence",
    stat: "presence"
  },
  leadership: {
    label: "VAGABOND.Skills.Leadership",
    stat: "presence"
  },
  performance: {
    label: "VAGABOND.Skills.Performance",
    stat: "presence"
  }
};

/**
 * Saves
 */
VAGABOND.saves = {
  endure: {
    label: "VAGABOND.Saves.Endure",
    stats: ["might", "might"]
  },
  reflex: {
    label: "VAGABOND.Saves.Reflex",
    stats: ["dexterity", "awareness"]
  },
  will: {
    label: "VAGABOND.Saves.Will",
    stats: ["reason", "presence"]
  }
};

/**
 * Statuses
 */
VAGABOND.statuses = [
  "berserk",
  "blinded",
  "burning",
  "charmed",
  "confused",
  "dazed",
  "fatigued",
  "frightened",
  "incapacitated",
  "invisible",
  "paralyzed",
  "prone",
  "restrained",
  "sickened",
  "suffocating",
  "unconscious",
  "vulnerable"
];

/**
 * Weapon Properties
 */
VAGABOND.weaponProperties = {
  brawl: "VAGABOND.WeaponProperties.Brawl",
  brutal: "VAGABOND.WeaponProperties.Brutal",
  cleave: "VAGABOND.WeaponProperties.Cleave",
  entangle: "VAGABOND.WeaponProperties.Entangle",
  finesse: "VAGABOND.WeaponProperties.Finesse",
  keen: "VAGABOND.WeaponProperties.Keen",
  long: "VAGABOND.WeaponProperties.Long",
  near: "VAGABOND.WeaponProperties.Near",
  ranged: "VAGABOND.WeaponProperties.Ranged",
  shield: "VAGABOND.WeaponProperties.Shield",
  thrown: "VAGABOND.WeaponProperties.Thrown"
};

/**
 * Weapon Grips
 */
VAGABOND.weaponGrips = {
  "1H": "VAGABOND.WeaponGrips.OneHanded",
  "2H": "VAGABOND.WeaponGrips.TwoHanded",
  "F": "VAGABOND.WeaponGrips.Fist",
  "V": "VAGABOND.WeaponGrips.Versatile"
};

/**
 * Distance
 */
VAGABOND.distances = {
  close: "VAGABOND.Distance.Close",
  near: "VAGABOND.Distance.Near",
  far: "VAGABOND.Distance.Far"
};

/**
 * Armor Types
 */
VAGABOND.armorTypes = {
  light: "VAGABOND.Armor.Light",
  medium: "VAGABOND.Armor.Medium",
  heavy: "VAGABOND.Armor.Heavy"
};

/**
 * NPC Zones
 */
VAGABOND.npcZones = {
  frontline: "VAGABOND.NPC.Frontline",
  midline: "VAGABOND.NPC.Midline",
  backline: "VAGABOND.NPC.Backline"
};

/**
 * Size Categories
 */
VAGABOND.sizes = {
  small: "VAGABOND.Size.Small",
  medium: "VAGABOND.Size.Medium",
  large: "VAGABOND.Size.Large",
  huge: "VAGABOND.Size.Huge",
  giant: "VAGABOND.Size.Giant",
  colossal: "VAGABOND.Size.Colossal"
};

/**
 * Being Types
 */
VAGABOND.beingTypes = {
  artificials: "VAGABOND.BeingType.Artificials",
  beasts: "VAGABOND.BeingType.Beasts",
  cryptids: "VAGABOND.BeingType.Cryptids",
  fae: "VAGABOND.BeingType.Fae",
  humanlike: "VAGABOND.BeingType.Humanlike",
  outers: "VAGABOND.BeingType.Outers",
  primordials: "VAGABOND.BeingType.Primordials",
  undead: "VAGABOND.BeingType.Undead"
};

/**
 * Spell Deliveries
 */
VAGABOND.spellDeliveries = {
  touch: {
    label: "VAGABOND.Spell.Touch",
    cost: 0
  },
  remote: {
    label: "VAGABOND.Spell.Remote",
    cost: 0
  },
  imbue: {
    label: "VAGABOND.Spell.Imbue",
    cost: 0
  },
  cube: {
    label: "VAGABOND.Spell.Cube",
    cost: 1
  },
  aura: {
    label: "VAGABOND.Spell.Aura",
    cost: 2
  },
  cone: {
    label: "VAGABOND.Spell.Cone",
    cost: 2
  },
  glyph: {
    label: "VAGABOND.Spell.Glyph",
    cost: 2
  },
  line: {
    label: "VAGABOND.Spell.Line",
    cost: 2
  },
  sphere: {
    label: "VAGABOND.Spell.Sphere",
    cost: 2
  }
};

/**
 * Spell Durations
 */
VAGABOND.spellDurations = {
  instant: "VAGABOND.Spell.Instant",
  focus: "VAGABOND.Spell.Focus",
  continual: "VAGABOND.Spell.Continual"
};

/**
 * Classes
 */
VAGABOND.classes = {
  bard: "VAGABOND.Class.Bard",
  fighter: "VAGABOND.Class.Fighter",
  luminary: "VAGABOND.Class.Luminary",
  pugilist: "VAGABOND.Class.Pugilist",
  rogue: "VAGABOND.Class.Rogue",
  wizard: "VAGABOND.Class.Wizard"
};

/**
 * Ancestries
 */
VAGABOND.ancestries = {
  human: "VAGABOND.Ancestry.Human",
  dwarf: "VAGABOND.Ancestry.Dwarf",
  elf: "VAGABOND.Ancestry.Elf",
  halfling: "VAGABOND.Ancestry.Halfling"
};
