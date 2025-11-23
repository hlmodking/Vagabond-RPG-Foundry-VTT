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
            editImage: VagabondItemSheet._onEditImage,
            toggleEditor: VagabondItemSheet._onToggleEditor
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
            template: "systems/vagabond/templates/item/item-sheet.hbs"
        }
    };
    
    get template() {
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
            case "perk":
                return "systems/vagabond/templates/item/perk-sheet.hbs";
            case "class":
                return "systems/vagabond/templates/item/class-sheet.hbs";
            case "ancestry":
                return "systems/vagabond/templates/item/ancestry-sheet.hbs";
            default:
                return "systems/vagabond/templates/item/item-sheet.hbs";
        }
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        
        context.item = this.document;
        context.system = this.document.system;
        context.config = CONFIG.VAGABOND;
        context.editable = this.isEditable;

        context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
            this.document.system.description || "", 
            {
                secrets: this.document.isOwner,
                relativeTo: this.document
            }
        );

        return context;
    }
    
    static async #onSubmitForm(event, form, formData) {
        const submitData = foundry.utils.expandObject(formData.object);
        await this.document.update(submitData);
    }
    
    _onRender(context, options) {
        super._onRender(context, options);
        
        const html = this.element;
        const form = html.querySelector('form');
        
        if (form) {
            form.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
            
            let submitTimeout;
            
            form.querySelectorAll('input:not([type="checkbox"]), select, textarea').forEach(input => {
                input.addEventListener('change', async (e) => {
                    clearTimeout(submitTimeout);
                    submitTimeout = setTimeout(async () => {
                        const fieldName = e.target.name;
                        let fieldValue = e.target.value;
                        
                        if (e.target.type === 'number') {
                            fieldValue = e.target.valueAsNumber;
                            if (isNaN(fieldValue)) fieldValue = 0;
                        }
                        
                        const updates = {};
                        updates[fieldName] = fieldValue;
                        
                        await this.document.update(updates);
                        
                        if (fieldName === 'name') {
                            e.target.value = this.document.name;
                        }
                    }, 300);
                });
            });
            
            form.querySelectorAll('input[type="checkbox"][name="system.properties"]').forEach(checkbox => {
                checkbox.addEventListener('change', async (e) => {
                    clearTimeout(submitTimeout);
                    submitTimeout = setTimeout(async () => {
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
    
    static _onEditImage(event, target) {
        const current = this.document.img;
        const fp = new foundry.applications.apps.FilePicker({
            type: "image",
            current: current,
            callback: path => {
                this.document.update({img: path});
            }
        });
        fp.render(true);
    }

    /**
     * Toggle description editor
     */
    static async _onToggleEditor(event, target) {
        event.preventDefault();
        
        const fieldName = target.dataset.target;
        const editorContainer = target.closest('.editor-container');
        const contentDiv = editorContainer.querySelector('.editor-content');
        const button = editorContainer.querySelector('.editor-edit');
        
        const textarea = contentDiv.querySelector('textarea');
        const isEditing = textarea !== null;
        
        if (isEditing) {
            let newContent = textarea.value;
            if (!newContent && textarea.dataset.backupValue) {
                newContent = textarea.dataset.backupValue;
            }
            
            await this.document.update({ [fieldName]: newContent });
            
            const enriched = await foundry.applications.ux.TextEditor.enrichHTML(newContent, {
                secrets: this.document.isOwner,
                relativeTo: this.document
            });
            
            contentDiv.innerHTML = enriched || '<p class="hint">No description yet.</p>';
            button.innerHTML = '<i class="fas fa-edit"></i> Edit';
            
        } else {
            const currentContent = foundry.utils.getProperty(this.document, fieldName) || "";
            
            const textarea = document.createElement('textarea');
            textarea.name = fieldName;
            textarea.rows = 15;
            textarea.style.cssText = 'width: 100%; font-family: monospace; padding: 8px;';
            textarea.value = currentContent;
            
            textarea.addEventListener('input', (e) => {
                e.target.dataset.backupValue = e.target.value;
            });
            
            contentDiv.innerHTML = '';
            contentDiv.appendChild(textarea);
            
            button.innerHTML = '<i class="fas fa-save"></i> Save';
            
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    }
}
