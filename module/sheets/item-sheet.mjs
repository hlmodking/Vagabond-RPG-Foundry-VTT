/**
 * Item Sheet using ApplicationV2 (Foundry v13)
 */

const { HandlebarsApplicationMixin } = foundry.applications.api;

export class VagabondItemSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {

    static DEFAULT_OPTIONS = {
        classes: ["vagabond", "sheet", "item"],
        position: {
            width: 500,
            height: 600
        },
        window: {
            resizable: true
        }
    };

    static PARTS = {
        sheet: {
            template: "systems/vagabond/templates/item/item-sheet.hbs"
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.system = this.document.system;
        context.config = CONFIG.VAGABOND;
        context.editable = this.isEditable;

        context.enrichedDescription = await foundry.applications.fields.enrichHTML(this.document.system.description, {
            secrets: this.document.isOwner,
            relativeTo: this.document
        });

        return context;
    }
}
