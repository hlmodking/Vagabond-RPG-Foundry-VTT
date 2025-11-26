/**
 * NPC Sheet using ApplicationV2 (Foundry v13)
 */

const { HandlebarsApplicationMixin } = foundry.applications.api;

export class VagabondNPCSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {

    static DEFAULT_OPTIONS = {
        classes: ["vagabond", "sheet", "actor", "npc"],
        position: {
            width: 465,
            height: 689
        },
        actions: {
            toggleEditor: VagabondNPCSheet._onToggleEditor,
            addAction: VagabondNPCSheet._onAddAction,
            removeAction: VagabondNPCSheet._onRemoveAction,
            addAbility: VagabondNPCSheet._onAddAbility,
            removeAbility: VagabondNPCSheet._onRemoveAbility
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

        context.system.actions ??= [];
        context.system.abilities ??= [];

        if (Array.isArray(context.system.senses)) {
            context.system.senses = context.system.senses.join(", ");
        }

        if (Array.isArray(context.system.weak)) {
            context.system.weak = context.system.weak.join(", ");
        }

        if (Array.isArray(context.system.immune)) {
            context.system.immune = context.system.immune.join(", ");
        }

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

    static async _onAddAction(event) {
        event.preventDefault();

        const actions = Array.from(this.document.system.actions ?? []);
        actions.push({ name: "", tags: "", effect: "" });

        await this.document.update({ "system.actions": actions });
    }

    static async _onRemoveAction(event, target) {
        event.preventDefault();

        const index = Number(target.dataset.index);
        if (Number.isNaN(index)) return;

        const actions = Array.from(this.document.system.actions ?? []);
        actions.splice(index, 1);

        await this.document.update({ "system.actions": actions });
    }

    static async _onAddAbility(event) {
        event.preventDefault();

        const abilities = Array.from(this.document.system.abilities ?? []);
        abilities.push({ name: "", description: "" });

        await this.document.update({ "system.abilities": abilities });
    }

    static async _onRemoveAbility(event, target) {
        event.preventDefault();

        const index = Number(target.dataset.index);
        if (Number.isNaN(index)) return;

        const abilities = Array.from(this.document.system.abilities ?? []);
        abilities.splice(index, 1);

        await this.document.update({ "system.abilities": abilities });
    }
}
