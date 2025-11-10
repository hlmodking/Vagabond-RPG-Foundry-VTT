/**
 * Vagabond RPG System
 * Main system initialization file
 */

import { VAGABOND } from "./config.mjs";
import { VagabondActor } from "./documents/actor.mjs";
import { VagabondItem } from "./documents/item.mjs";
import { VagabondCharacterSheet } from "./sheets/character-sheet.mjs";
import { VagabondNPCSheet } from "./sheets/npc-sheet.mjs";
import { VagabondItemSheet } from "./sheets/item-sheet.mjs";

/* -------------------------------------------- */
/*  System Initialization                       */
/* -------------------------------------------- */

Hooks.once("init", function() {
  console.log("Vagabond | Initializing Vagabond RPG System");

  // Add configuration to global scope
  game.vagabond = {
    VagabondActor,
    VagabondItem,
    config: VAGABOND
  };

  // Configure global settings
  CONFIG.VAGABOND = VAGABOND;
  CONFIG.Actor.documentClass = VagabondActor;
  CONFIG.Item.documentClass = VagabondItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("vagabond", VagabondCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "VAGABOND.SheetLabels.Character"
  });
  Actors.registerSheet("vagabond", VagabondNPCSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "VAGABOND.SheetLabels.NPC"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("vagabond", VagabondItemSheet, {
    makeDefault: true,
    label: "VAGABOND.SheetLabels.Item"
  });

  // Register system settings
  registerSystemSettings();

  // Preload Handlebars templates
  preloadHandlebarsTemplates();

  // Register Handlebars helpers
  registerHandlebarsHelpers();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", function() {
  console.log("Vagabond | System Ready");
  
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    // Handle hotbar drops
    return true;
  });
});

/* -------------------------------------------- */
/*  System Settings                             */
/* -------------------------------------------- */

function registerSystemSettings() {
  // Initiative formula
  game.settings.register("vagabond", "initiativeFormula", {
    name: "VAGABOND.Settings.InitiativeFormula.Name",
    hint: "VAGABOND.Settings.InitiativeFormula.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "1d20",
    onChange: () => {
      console.log("Vagabond | Initiative formula changed");
    }
  });

  // Turn order (Heroes first or clockwise)
  game.settings.register("vagabond", "clockwiseTurns", {
    name: "VAGABOND.Settings.ClockwiseTurns.Name",
    hint: "VAGABOND.Settings.ClockwiseTurns.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Plot Armor variant rule
  game.settings.register("vagabond", "plotArmor", {
    name: "VAGABOND.Settings.PlotArmor.Name",
    hint: "VAGABOND.Settings.PlotArmor.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
}

/* -------------------------------------------- */
/*  Handlebars Templates                        */
/* -------------------------------------------- */

async function preloadHandlebarsTemplates() {
  const templatePaths = [
    // Actor Sheet Partials
    "systems/vagabond/templates/partials/stats.hbs",
    "systems/vagabond/templates/partials/skills.hbs",
    "systems/vagabond/templates/partials/inventory.hbs",
    "systems/vagabond/templates/partials/spells.hbs",
    "systems/vagabond/templates/partials/features.hbs",
    
    // Item Sheet Partials
    "systems/vagabond/templates/partials/item-header.hbs"
  ];

  return loadTemplates(templatePaths);
}

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

function registerHandlebarsHelpers() {
  // Concat helper
  Handlebars.registerHelper("concat", function(...args) {
    args.pop(); // Remove the options object
    return args.join("");
  });

  // Math helpers
  Handlebars.registerHelper("add", function(a, b) {
    return a + b;
  });

  Handlebars.registerHelper("subtract", function(a, b) {
    return a - b;
  });

  Handlebars.registerHelper("multiply", function(a, b) {
    return a * b;
  });

  // Comparison helpers
  Handlebars.registerHelper("eq", function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper("ne", function(a, b) {
    return a !== b;
  });

  Handlebars.registerHelper("lt", function(a, b) {
    return a < b;
  });

  Handlebars.registerHelper("gt", function(a, b) {
    return a > b;
  });

  Handlebars.registerHelper("lte", function(a, b) {
    return a <= b;
  });

  Handlebars.registerHelper("gte", function(a, b) {
    return a >= b;
  });

  // Localization helper
  Handlebars.registerHelper("localize", function(key) {
    return game.i18n.localize(key);
  });

  // Format modifier helper (adds + for positive numbers)
  Handlebars.registerHelper("formatModifier", function(value) {
    const num = parseInt(value);
    if (isNaN(num)) return "+0";
    return num >= 0 ? `+${num}` : `${num}`;
  });

  // Calculate difficulty helper
  Handlebars.registerHelper("calculateDifficulty", function(stat, trained) {
    const statValue = parseInt(stat) || 0;
    const multiplier = trained ? 2 : 1;
    return 20 - (statValue * multiplier);
  });
}