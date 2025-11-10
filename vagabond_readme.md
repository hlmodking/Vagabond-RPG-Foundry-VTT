# Vagabond RPG - Foundry VTT System

A game system for running Vagabond RPG campaigns in Foundry Virtual Tabletop (v13+).

## Installation

1. Copy this entire system folder into your Foundry `Data/systems` directory
2. The folder should be named `vagabond`
3. Restart Foundry VTT
4. Create a new world using the "Vagabond RPG" system

## Current Implementation Status

### ✅ Completed
- Basic system structure with v13 ApplicationV2 architecture
- Core data models for Characters and NPCs
- Stats system (6 stats: Might, Dexterity, Awareness, Reason, Presence, Luck)
- Skills with training system
- Saves calculation (Endure, Reflex, Will)
- HP calculation (Might × Level for characters)
- Speed calculation based on Dexterity
- Inventory slots system (8 + Might)
- Luck pool system
- Basic check rolling with Favor/Hinder
- Rest and Breather mechanics
- Item templates for all types
- Localization framework

### 🚧 In Progress / To Do

#### High Priority
1. **Character Sheet Templates**
   - Create Handlebars templates for each tab
   - Style with CSS
   - Implement drag-and-drop for items

2. **Item Sheets**
   - Weapon sheet with properties/grip selection
   - Armor sheet
   - Spell sheet with delivery options
   - Perk sheet with prerequisites
   - Class/Ancestry sheets

3. **Combat System**
   - Attack rolls with weapon skills
   - Damage rolls
   - Block/Dodge system
   - Status effects implementation
   - Zone-based NPC behavior

4. **Magic System**
   - Spell casting with Mana
   - Delivery type selection
   - Focus tracking
   - Spell effect automation

#### Medium Priority
5. **Compendiums**
   - Weapons compendium
   - Armor compendium
   - Spells compendium
   - Perks compendium
   - Classes compendium
   - Ancestries compendium

6. **Automation**
   - Automatic slot calculation when items added/removed
   - Fatigue effects
   - Status effect automation
   - Burning countdown dice

7. **NPC Sheet**
   - Zone display
   - Morale checks
   - Action priority system

#### Low Priority
8. **Advanced Features**
   - Crawl/Travel time tracking
   - Random encounter system
   - Downtime activities
   - Inventory weight visualization
   - Wealth conversion helpers

## File Structure

```
vagabond/
├── system.json              # System manifest
├── template.json            # Data model definitions
├── module/
│   ├── vagabond.mjs        # Main entry point
│   ├── config.mjs          # System constants
│   ├── documents/
│   │   ├── actor.mjs       # Actor document class
│   │   └── item.mjs        # Item document class (TO DO)
│   └── sheets/
│       ├── character-sheet.mjs  # Character sheet
│       ├── npc-sheet.mjs        # NPC sheet (TO DO)
│       └── item-sheet.mjs       # Item sheet (TO DO)
├── templates/              # Handlebars templates (TO DO)
├── styles/                 # CSS stylesheets (TO DO)
└── lang/
    └── en.json            # English localization
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
- **Saves**: See actor.mjs for formulas
- **Mana Spend Limit**: Casting Stat + (Level ÷ 2)

## Development Notes

### Using ApplicationV2 (Foundry v13)
This system uses the new ApplicationV2 framework:
- Static `DEFAULT_OPTIONS` instead of `defaultOptions()`
- Static `PARTS` for template sections
- `_prepareContext()` instead of `getData()`
- Actions system with `data-action` attributes
- No jQuery by default (uses native DOM)

### Next Steps for Development

1. **Create the Templates**
   Start with `templates/actor/character-sheet-header.hbs`:
   ```handlebars
   <header class="sheet-header">
     <img class="profile-img" src="{{actor.img}}" alt="{{actor.name}}" />
     <div class="header-fields">
       <h1 class="charname">
         <input name="name" type="text" value="{{actor.name}}" placeholder="Character Name"/>
       </h1>
       <div class="resources">
         <div class="resource">
           <label>HP</label>
           <input type="text" name="system.hp.value" value="{{system.hp.value}}" />
           <span class="sep">/</span>
           <span class="max">{{system.hp.max}}</span>
         </div>
         <!-- Add more resources -->
       </div>
     </div>
   </header>
   ```

2. **Style the Sheets**
   Create `styles/vagabond.css` using CSS layers for v13 compatibility

3. **Implement Item Documents**
   Create `module/documents/item.mjs` extending the Item class

4. **Build Item Sheets**
   Create sheets for weapons, armor, spells, etc.

5. **Add Compendiums**
   Create compendium packs with system content

## Contributing

This is a community-developed system for Vagabond RPG. Contributions welcome!

## License

This system is unofficial and not affiliated with Land of the Blind, LLC.

Vagabond RPG © 2024 Land of the Blind, LLC

## Credits

System development: [Your Name]
Based on Vagabond RPG by Taron Pounds