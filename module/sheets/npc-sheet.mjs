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
        actions: {
            toggleEditor: VagabondNPCSheet._onToggleEditor
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

        context.enrichedBiography = await foundry.applications.ux.TextEditor.enrichHTML(
            this.document.system.biography || "", 
            {
                secrets: this.document.isOwner,
                relativeTo: this.document
            }
        );

        return context;
    }

    /**
     * Toggle biography editor
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
