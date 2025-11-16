/**
 * Item Sheet using ApplicationV2 (Foundry v13)
 */

const { HandlebarsApplicationMixin } = foundry.applications.api;

export class VagabondItemSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {

    static DEFAULT_OPTIONS = {
        classes: ["vagabond", "sheet", "item"],
        position: {
            width: 600,
            height: 700
        },
        actions: {
            showImage: VagabondItemSheet._onShowImage
        },
        window: {
            resizable: true,
            title: "Item Sheet"
        },
        form: {
            submitOnChange: true,
            closeOnSubmit: false,
            handler: VagabondItemSheet.#onSubmitForm
        }
    };

    static PARTS = {
        form: {
            template: "systems/vagabond/templates/item/weapon-sheet.hbs"
        }
    };
    
    /** @override */
    get template() {
        // Return different templates based on item type
        const type = this.document.type;
        
        switch (type) {
            case "weapon":
                return "systems/vagabond/templates/item/weapon-sheet.hbs";
            case "armor":
                return "systems/vagabond/templates/item/armor-sheet.hbs";
            case "spell":
                return "systems/vagabond/templates/item/spell-sheet.hbs";
            case "gear":
                return "systems/vagabond/templates/item/gear-sheet.hbs";
            default:
                return "systems/vagabond/templates/item/item-sheet.hbs";
        }
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.system = this.document.system;
        context.config = CONFIG.VAGABOND;
        context.editable = this.isEditable;

        // Enrich the description using the correct v13 API
        context.enrichedDescription = await foundry.applications.fields.HTMLField.enrichHTML(
            this.document.system.description || "", 
            {
                secrets: this.document.isOwner,
                relativeTo: this.document,
                async: true
            }
        );

        return context;
    }
    
    /**
     * Handle form submission
     */
    static async #onSubmitForm(event, form, formData) {
        const submitData = foundry.utils.expandObject(formData.object);
        await this.document.update(submitData);
    }
    
    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);
        
        // MANUAL FIX: Since submitOnChange isn't working reliably, manually wire up input changes
        const html = this.element;
        const form = html.querySelector('form');
        
        if (form) {
            let submitTimeout;
            
            // Handle regular inputs
            form.querySelectorAll('input:not([type="checkbox"]), select, textarea').forEach(input => {
                input.addEventListener('change', async (e) => {
                    clearTimeout(submitTimeout);
                    submitTimeout = setTimeout(async () => {
                        const formData = new FormDataExtended(form);
                        const submitData = foundry.utils.expandObject(formData.object);
                        await this.document.update(submitData);
                    }, 300);
                });
            });
            
            // Handle checkboxes (properties) specially
            form.querySelectorAll('input[type="checkbox"][name="system.properties"]').forEach(checkbox => {
                checkbox.addEventListener('change', async (e) => {
                    clearTimeout(submitTimeout);
                    submitTimeout = setTimeout(async () => {
                        // Collect all checked property values
                        const checkedBoxes = form.querySelectorAll('input[type="checkbox"][name="system.properties"]:checked');
                        const properties = Array.from(checkedBoxes).map(cb => cb.value);
                        
                        await this.document.update({
                            'system.properties': properties
                        });
                    }, 300);
                });
            });
        }
    }
    
    /**
     * Show item image
     */
    static _onShowImage(event, target) {
        const img = target.src || this.document.img;
        new ImagePopout(img, {
            title: this.document.name,
            shareable: true
        }).render(true);
    }
}
