# Vagabond System Folder Structure

```
vagabond/
├── system.json
├── template.json
├── LICENSE
├── README.md
├── CHANGELOG.md
│
├── module/
│   ├── vagabond.mjs                 # Main system entry point
│   ├── config.mjs                   # System configuration constants
│   │
│   ├── data/
│   │   ├── actor-character.mjs      # Character data model
│   │   ├── actor-npc.mjs            # NPC data model
│   │   ├── item-weapon.mjs          # Weapon data model
│   │   ├── item-armor.mjs           # Armor data model
│   │   ├── item-gear.mjs            # Gear data model
│   │   ├── item-spell.mjs           # Spell data model
│   │   ├── item-perk.mjs            # Perk data model
│   │   ├── item-class.mjs           # Class data model
│   │   └── item-ancestry.mjs        # Ancestry data model
│   │
│   ├── documents/
│   │   ├── actor.mjs                # Actor document class
│   │   └── item.mjs                 # Item document class
│   │
│   ├── sheets/
│   │   ├── actor-sheet.mjs          # Base actor sheet
│   │   ├── character-sheet.mjs      # Character sheet
│   │   ├── npc-sheet.mjs            # NPC sheet
│   │   └── item-sheet.mjs           # Item sheet
│   │
│   ├── helpers/
│   │   ├── dice.mjs                 # Dice rolling helpers
│   │   ├── checks.mjs               # Check resolution
│   │   └── combat.mjs               # Combat helpers
│   │
│   └── applications/
│       └── check-dialog.mjs         # Check rolling dialog
│
├── styles/
│   ├── vagabond.css                 # Main stylesheet
│   ├── actor-sheet.css              # Actor sheet styles
│   └── item-sheet.css               # Item sheet styles
│
├── templates/
│   ├── actor/
│   │   ├── character-sheet.hbs      # Character sheet template
│   │   └── npc-sheet.hbs            # NPC sheet template
│   │
│   ├── item/
│   │   └── item-sheet.hbs           # Generic item sheet
│   │
│   └── partials/
│       ├── stats.hbs                # Stats partial
│       ├── skills.hbs               # Skills partial
│       ├── inventory.hbs            # Inventory partial
│       └── spells.hbs               # Spells partial
│
├── lang/
│   └── en.json                      # English localization
│
└── assets/
    ├── icons/                       # System icons
    └── images/                      # System images
```

## Key Files Purpose

- **system.json**: System manifest with metadata
- **template.json**: Data model templates for Actors and Items
- **vagabond.mjs**: Main entry point, initializes the system
- **config.mjs**: Constants for stats, skills, statuses, etc.
- **data/**: DataModel classes (v10+ Foundry approach)
- **documents/**: Actor and Item document extensions
- **sheets/**: ApplicationV2 sheet classes
- **helpers/**: Utility functions for dice, checks, combat
- **templates/**: Handlebars templates for sheets