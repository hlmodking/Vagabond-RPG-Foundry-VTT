/**
 * Dialog for casting spells in Vagabond RPG
 * Prompts for delivery method, damage dice, and other options
 */
export class SpellCastDialog extends Dialog {
  
  constructor(spell, actor, options = {}) {
    const dialogData = {
      title: `Cast ${spell.name}`,
      content: SpellCastDialog._createContent(spell, actor),
      buttons: {
        cast: {
          icon: '<i class="fas fa-magic"></i>',
          label: "Cast Spell",
          callback: html => SpellCastDialog._onCast(html, spell, actor)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "cast",
      close: () => null
    };
    
    super(dialogData, options);
    this.spell = spell;
    this.actor = actor;
  }
  
  /**
   * Create the dialog content HTML
   */
  static _createContent(spell, actor) {
    const systemData = spell.system;
    const hasDamage = systemData.damageBase && systemData.damageBase !== "";
    
    // Calculate available mana
    const currentMana = actor.system.mana?.value || 0;
    const maxMana = actor.system.mana?.max || 0;
    const spendLimit = actor.system.mana?.spendLimit || 0;
    
    // Delivery options with costs
    const deliveryOptions = {
      touch: { label: "Touch", cost: 0, description: "A Close Target, or yourself" },
      remote: { label: "Remote", cost: 0, description: "An ambience or bolt on a Target" },
      imbue: { label: "Imbue", cost: 0, description: "Targets a Weapon equipped by a willing Being within Far" },
      cube: { label: "Cube", cost: 1, description: "5-foot cube that you can see" },
      aura: { label: "Aura", cost: 2, description: "10-foot-radius from you, affecting Targets of your choice" },
      cone: { label: "Cone", cost: 2, description: "15-foot cone Area in front of you" },
      glyph: { label: "Glyph", cost: 2, description: "Creates a 5-foot-square glyph on a Target" },
      line: { label: "Line", cost: 2, description: "5-foot-wide, 30-feet-long, 10-feet-tall Area" },
      sphere: { label: "Sphere", cost: 2, description: "5-foot-radius sphere in sight" }
    };
    
    let html = `
      <form class="spell-cast-form">
        <div class="form-group">
          <label><strong>Spell:</strong> ${spell.name}</label>
        </div>
        
        <div class="form-group">
          <label><strong>Effect:</strong></label>
          <p>${systemData.effect || "No effect described"}</p>
        </div>
        
        ${hasDamage ? `
        <div class="form-group">
          <label><strong>Damage Base:</strong> ${systemData.damageBase}</label>
        </div>
        ` : ''}
        
        <hr>
        
        <div class="form-group">
          <label><strong>Mana Available:</strong> ${currentMana} / ${maxMana}</label>
          <label><strong>Mana Spend Limit:</strong> ${spendLimit} per cast</label>
        </div>
        
        <hr>
        
        <div class="form-group">
          <label for="delivery"><strong>Delivery Method:</strong></label>
          <select name="delivery" id="delivery" data-dtype="String">
    `;
    
    for (const [key, data] of Object.entries(deliveryOptions)) {
      const selected = key === systemData.delivery ? 'selected' : '';
      html += `<option value="${key}" data-cost="${data.cost}" ${selected}>
        ${data.label} (${data.cost} Mana) - ${data.description}
      </option>`;
    }
    
    html += `
          </select>
          <p class="hint">Base delivery cost</p>
        </div>
        
        ${hasDamage ? `
        <div class="form-group">
          <label for="damageDice"><strong>Damage Dice:</strong></label>
          <input type="number" name="damageDice" id="damageDice" value="1" min="1" max="${spendLimit}" data-dtype="Number"/>
          <p class="hint">Each die costs 2 Mana. Deals ${systemData.damageBase} damage.</p>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" name="dealDamage" checked/>
            Deal damage (otherwise only effects apply)
          </label>
        </div>
        ` : ''}
        
        <div class="form-group">
          <label for="duration"><strong>Duration:</strong></label>
          <select name="duration" id="duration" data-dtype="String">
            <option value="instant" ${systemData.duration === 'instant' ? 'selected' : ''}>Instant (0 Mana)</option>
            <option value="focus">Focus (0 Mana, requires concentration)</option>
            <option value="continual">Continual (1 Mana each Round to maintain)</option>
          </select>
        </div>
        
        <hr>
        
        <div class="form-group">
          <label><strong>Total Mana Cost:</strong> <span id="totalCost">Calculating...</span></label>
        </div>
      </form>
      
      <script>
        // Calculate total mana cost dynamically
        function updateManaCost() {
          const form = document.querySelector('.spell-cast-form');
          const delivery = form.querySelector('#delivery');
          const damageDice = form.querySelector('#damageDice');
          const dealDamage = form.querySelector('[name="dealDamage"]');
          
          let total = 0;
          
          // Delivery cost
          const deliveryOption = delivery.options[delivery.selectedIndex];
          total += parseInt(deliveryOption.dataset.cost) || 0;
          
          // Damage cost (2 mana per die if dealing damage)
          if (damageDice && dealDamage && dealDamage.checked) {
            total += (parseInt(damageDice.value) || 0) * 2;
          }
          
          // Duration handled separately (Focus is per round)
          
          document.querySelector('#totalCost').textContent = total + " Mana";
          
          // Warn if over limit
          if (total > ${spendLimit}) {
            document.querySelector('#totalCost').style.color = 'red';
            document.querySelector('#totalCost').textContent += " (OVER LIMIT!)";
          } else if (total > ${currentMana}) {
            document.querySelector('#totalCost').style.color = 'orange';
            document.querySelector('#totalCost').textContent += " (Not enough mana!)";
          } else {
            document.querySelector('#totalCost').style.color = 'inherit';
          }
        }
        
        // Update cost when options change
        document.querySelector('#delivery').addEventListener('change', updateManaCost);
        const damageDiceInput = document.querySelector('#damageDice');
        if (damageDiceInput) {
          damageDiceInput.addEventListener('input', updateManaCost);
        }
        const dealDamageCheck = document.querySelector('[name="dealDamage"]');
        if (dealDamageCheck) {
          dealDamageCheck.addEventListener('change', updateManaCost);
        }
        
        // Initial calculation
        updateManaCost();
      </script>
    `;
    
    return html;
  }
  
  /**
   * Handle casting the spell
   */
  static async _onCast(html, spell, actor) {
    const form = html.find('form')[0];
    const formData = new FormDataExtended(form).object;
    
    // Calculate mana cost
    const deliveryCost = parseInt(form.querySelector('#delivery').selectedOptions[0].dataset.cost) || 0;
    let manaCost = deliveryCost;
    
    // Add damage cost if applicable
    if (formData.dealDamage && formData.damageDice) {
      manaCost += formData.damageDice * 2;
    }
    
    // Check mana availability
    const currentMana = actor.system.mana?.value || 0;
    const spendLimit = actor.system.mana?.spendLimit || 0;
    
    if (manaCost > currentMana) {
      ui.notifications.warn("Not enough Mana to cast this spell!");
      return null;
    }
    
    if (manaCost > spendLimit) {
      ui.notifications.warn(`Cannot spend more than ${spendLimit} Mana per cast!`);
      return null;
    }
    
    // Cast the spell
    return await spell.cast({
      delivery: formData.delivery,
      duration: formData.duration,
      dealDamage: formData.dealDamage,
      damageDice: formData.damageDice || 0,
      manaCost: manaCost
    });
  }
  
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }
}
