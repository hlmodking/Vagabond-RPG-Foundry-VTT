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
      edit
