# Vagabond RPG - Foundry VTT System

A game system for running Vagabond RPG campaigns in Foundry Virtual Tabletop (v13+).

## Installation

1. Copy this entire system folder into your Foundry `Data/systems` directory
2. The folder should be named `vagabond`
3. Restart Foundry VTT
4. Create a new world using the "Vagabond RPG" system

## Current Implementation Status

### ✅ Completed

#### Core System Architecture
- ✅ Basic system structure with v13 ApplicationV2 architecture
- ✅ Core data models for Characters and NPCs
- ✅ System configuration and constants (config.mjs)
- ✅ Localization framework (English)
- ✅ CSS styling matching Vagabond RPG book aesthetic

#### Character System
- ✅ Stats system (6 stats: Might, Dexterity, Awareness, Reason, Presence, Luck)
- ✅ Skills with training system (14 skills)
- ✅ Saves calculation (Endure, Reflex, Will)
- ✅ HP calculation (Might × Level for characters)
- ✅ Speed calculation based on Dexterity
- ✅ Inventory slots system (8 + Might)
- ✅ Luck pool system
- ✅ Rest and Breather mechanics
- ✅ Character sheet with all tabs (Stats, Skills, Inventory, Biography)
- ✅ Manual form handling with auto-save

#### Item System
- ✅ Item templates for all 7 types (weapon, armor, gear, spell, perk, class, ancestry)
- ✅ Item document class with derived data
- ✅ **Weapon sheet** - Complete with 11 properties, damage die, range, grip
- ✅ **Armor sheet** - Complete with type selection, rating, might requirement
- ✅ Item sheet with dynamic template routing
- ✅ Auto-save functionality (300ms debounce)
- ✅ Rich text description editor

#### NPC System
- ✅ NPC data model with Hit Dice, zones, morale
- ✅ NPC sheet with stats and description

#### Mechanics
- ✅ Check rolling with Favor/Hinder
- ✅ Difficulty calculation (20 - Stat × 2 if trained)
- ✅ Damage rolling for weapons
- ✅ Spell casting framework

### 🚧 In Progress / To Do

#### High Priority

1. **Remaining Item Sheets**
   - [ ] Spell sheet with delivery options
   - [ ] Gear/Equipment sheet
   - [ ] Perk sheet with prerequisites
   - [ ] Class sheet with features
   - [ ] Ancestry sheet with traits

2. **Combat System**
   - [ ] Attack rolls with weapon skills
   - [ ] Damage rolls in chat
   - [ ] Block/Dodge system
   - [ ] Status effects implementation
   - [ ] Zone-based NPC behavior

3. **Magic System**
   - [ ] Complete spell casting with Mana
   - [ ] Delivery type selection UI
   - [ ] Focus tracking
   - [ ] Spell effect automation

#### Medium Priority

4. **Compendiums**
   - [ ] Weapons compendium (swords, axes, bows, etc.)
   - [ ] Armor compendium (light, medium, heavy)
   - [ ] Spells compendium (all Vagabond spells)
   - [ ] Perks compendium
   - [ ] Classes compendium (Bard, Fighter, Luminary, Pugilist, Rogue, Wizard)
   - [ ] Ancestries compendium (Human, Dwarf, Elf, Halfling)

5. **Automation**
   - [ ] Automatic slot calculation when items added/removed
   - [ ] Fatigue effects
   - [ ] Status effect automation
   - [ ] Burning countdown dice
   - [ ] Armor rating calculation from equipped armor
   - [ ] Might requirement checking for armor

6. **NPC Enhancements**
   - [ ] Zone display and movement
   - [ ] Morale checks
   - [ ] Action priority system
   - [ ] NPC attack automation

#### Low Priority

7. **Advanced Features**
   - [ ] Crawl/Travel time tracking
   - [ ] Random encounter system
   - [ ] Downtime activities
   - [ ] Inventory weight visualization
   - [ ] Wealth conversion helpers (gold ↔ silver ↔ copper)
   - [ ] Drag and drop item reordering

## File Structure

```
vagabond/
├── system.json              # System manifest
├── template.json            # Data model definitions
├── module/
│   ├── vagabond.mjs        # Main entry point
│   ├── config.mjs          # System constants
│   ├── documents/
│   │   ├── actor.mjs       # Actor document class ✅
│   │   └── item.mjs        # Item document class ✅
│   └── sheets/
│       ├── character-sheet.mjs  # Character sheet ✅
│       ├── npc-sheet.mjs        # NPC sheet ✅
│       └── item-sheet.mjs       # Item sheet ✅
├── templates/
│   ├── actor/
│   │   ├── character-sheet.hbs  # Character sheet ✅
│   │   └── npc-sheet.hbs        # NPC sheet ✅
│   └── item/
│       ├── weapon-sheet.hbs     # Weapon sheet ✅
│       ├── armor-sheet.hbs      # Armor sheet ✅
│       └── item-sheet.hbs       # Generic fallback
├── styles/
│   └── vagabond.css        # Complete styling ✅
└── lang/
    └── en.json            # English localization ✅
```

## Key Mechanics Implementation

### Check System
Checks use the formula: `Difficulty = 20 - (Stat × 2 if Trained)`
- Roll d20 vs Difficulty
- Natural 20 = Crit
- Roll ≥ Difficulty = Pass
- Roll < Difficulty = Fail
- Favor adds +d6, Hinder adds -d6

### Character Stats
All stats range from 2-7 and are used to calculate:
- **Might**: Max HP, Inventory Slots, Endure Save, Brawl/Melee
- **Dexterity**: Speed, Reflex Save, Finesse/Sneak
- **Awareness**: Reflex Save, Detect/Mysticism/Survival/Ranged
- **Reason**: Will Save, Arcana/Craft/Medicine
- **Presence**: Will Save, Influence/Leadership/Performance
- **Luck**: Luck Pool (spent for advantages)

### Derived Values
- **Max HP**: Might × Level
- **Inventory Slots**: 8 + Might
- **Speed**: 25/30/35 ft based on Dexterity (2-3/4-5/6-7)
- **Saves**: Calculated from stat combinations
- **Mana Spend Limit**: Casting Stat + (Level ÷ 2)

### Weapon Properties
All 11 weapon properties from Vagabond RPG:
- **Brawl**: Can use Brawl skill
- **Brutal**: Crits on 19-20
- **Cleave**: Hit adjacent foe on crit
- **Entangle**: Can restrain targets
- **Finesse**: Can use Finesse skill
- **Keen**: +1 damage on hit
- **Long**: 10ft reach
- **Near**: Attacks at Near range
- **Ranged**: Can use Ranged skill
- **Shield**: +1 to Block
- **Thrown**: Can be thrown

### Armor Types
Three armor types with different characteristics:
- **Light Armor**: Rating 1, Might Requirement 3
- **Medium Armor**: Rating 2, Might Requirement 4
- **Heavy Armor**: Rating 3, Might Requirement 5

## Technical Details

### Using ApplicationV2 (Foundry v13)
This system uses the new ApplicationV2 framework:
- Static `DEFAULT_OPTIONS` instead of `defaultOptions()`
- Static `PARTS` for template sections
- `_prepareContext()` instead of `getData()`
- Actions system with `data-action` attributes
- Private static methods for form handling (`#onSubmitForm`)
- No jQuery by default (uses native DOM)

### Auto-Save Form Handling
All sheets implement auto-save with:
- 300ms debounce on input changes
- Proper handling of number inputs
- Checkbox array support for properties
- Manual field-by-field updates
- Enter key prevention (except in textareas)

### Template Routing
The item sheet automatically loads the correct template based on item type:
```javascript
get template() {
  const templates = {
    weapon: "systems/vagabond/templates/item/weapon-sheet.hbs",
    armor: "systems/vagabond/templates/item/armor-sheet.hbs",
    // ... more types
  };
  return templates[this.document.type];
}
```

### Rich Text Editor
All description fields use Foundry v13's correct enrichHTML API:
```javascript
await foundry.applications.ux.TextEditor.implementation.enrichHTML(
  content, {
    secrets: this.document.isOwner,
    relativeTo: this.document,
    async: true
  }
);
```

## Design Philosophy

The system follows the Vagabond RPG book aesthetic:
- **Colors**: Dark charcoal primary, bright yellow accents
- **Typography**: Oswald for headers, Crimson Pro for body text
- **Layout**: Yellow sidebar accent, clean white backgrounds
- **Styling**: CSS Layers for v13 compatibility
- **Responsiveness**: Mobile-friendly layouts

## Development Notes

### Recently Completed
- ✅ Full weapon sheet with all 11 properties
- ✅ Complete armor sheet with type selection and visual guidelines
- ✅ Dynamic template routing for item sheets
- ✅ Auto-save functionality across all sheets
- ✅ Rich text editor integration
- ✅ CSS styling for all implemented sheets

### Next Development Steps

1. **Create Spell Sheet** (Next Priority)
   - Damage base selection
   - Delivery type dropdown (9 types)
   - Mana cost calculation
   - Effect description
   - Duration and school

2. **Create Gear Sheet**
   - Simpler than weapons/armor
   - Type selection (adventuring, tools, etc.)
   - Basic slots/quantity/pricing

3. **Create Perk Sheet**
   - Prerequisites checking
   - Stat requirements
   - Training requirements
   - Repeatable flag

4. **Build Compendiums**
   - Start with weapons (common ones from book)
   - Then armor sets
   - Then basic spells

5. **Combat Integration**
   - Connect weapon attacks to chat
   - Show damage rolls with properties
   - Block/Dodge mechanics

## Testing Checklist

### Currently Testable
- [x] Create character with stats
- [x] Roll skill checks with Favor/Hinder
- [x] Create weapon items
- [x] Set weapon properties (all 11)
- [x] Create armor items
- [x] Set armor type and requirements
- [x] Auto-save verification (wait 1s, reopen)
- [x] Description formatting with rich text

### Needs Testing
- [ ] Spell casting
- [ ] Combat rolls
- [ ] Status effects
- [ ] NPC actions
- [ ] Compendium imports

## Known Issues

None currently! 🎉

If you encounter issues:
1. Check browser console (F12) for errors
2. Verify Foundry VTT is v13 or higher
3. Ensure all files are in correct locations
4. Try hard refresh (Ctrl+Shift+R)

## Contributing

This is a community-developed system for Vagabond RPG. Contributions welcome!

Areas that need help:
- Compendium content creation
- Testing and bug reports
- Documentation improvements
- Additional item sheet implementations

## Roadmap

### Phase 1: Core Items ✅ (COMPLETE)
- Character sheets
- Weapon sheets
- Armor sheets

### Phase 2: Magic & Gear (Current)
- Spell sheets
- Gear sheets
- Perk sheets

### Phase 3: Content
- Compendiums for all item types
- Pre-made characters
- Sample NPCs

### Phase 4: Automation
- Combat automation
- Status effect tracking
- Automatic calculations

### Phase 5: Polish
- Additional features
- Quality of life improvements
- Performance optimization

## License

This system is unofficial and not affiliated with Land of the Blind, LLC.

**Vagabond RPG** © 2024 Land of the Blind, LLC

## Credits

- **System Development**: Community contribution
- **Based on**: Vagabond RPG by Taron Pounds
- **Foundry VTT**: v13 ApplicationV2 architecture
- **Design**: Inspired by Vagabond RPG book interior

## Version History

- **v0.3.0** - Armor sheet implementation, template routing
- **v0.2.0** - Weapon sheet with all 11 properties
- **v0.1.0** - Initial character sheet and core system

---

**Ready to play?** Create a world, make a character, and start your adventure in the Vagabond RPG! ⚔️🛡️
