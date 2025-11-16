/**
 * NPC Sheet using ApplicationV2 (Foundry v13)
 */

const { HandlebarsApplicationMixin } = foundry.applications.api;

export class VagabondNPCSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {

    static DEFAULT_OPTIONS = {
        classes: ["vagabond", "sheet", "actor", "npc"],
        position: {
            width: 600,
            height: 700
        },
        window: {
            resizable: true
        }
    };

    static PARTS = {
        sheet: {
            template: "systems/vagabond/templates/actor/npc-sheet.hbs"
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.system = this.document.system;
        context.config = CONFIG.VAGABOND;
        context.editable = this.isEditable;

        // Enrich biography using correct v13 API
        context.enrichedBiography = await foundry.applications.fields.HTMLField.enrichHTML(
            this.document.system.biography || "", 
            {
                secrets: this.document.isOwner,
                relativeTo: this.document,
                async: true
            }
        );

        return context;
    }
}
