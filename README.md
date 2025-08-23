# STRES v2.0 Enhanced - SillyTavern RPG Enhancement System Extension

🎲 **The ultimate RPG automation platform** - Transform SillyTavern into a comprehensive RPG system with advanced character management, character card support, world building, lorebooks, and revolutionary LLM tool integration.

## ✨ What Makes STRES v2.0 Enhanced Special

### **🤖 Revolutionary LLM Integration**
- **20+ Advanced RPG Tools**: Complete toolkit for character creation, skills, magic, world building, and lorebooks
- **Zero-Setup Tool Calling**: Automatically injects enhanced RPG tools into GPT-4/5, Claude, and Gemini API calls
- **Context-Aware Activation**: Smart detection of RPG content with enhanced keyword recognition
- **Real-Time Execution**: LLMs can create characters, learn skills, cast spells, manage factions, and build entire worlds instantly
- **Multi-Provider Support**: Works seamlessly across all major LLM providers with provider-specific optimizations

### **📋 Character Card Compatibility**
- **Universal Import**: Support for v2, SillyTavern, STRES native, and generic JSON character card formats
- **Automatic Detection**: Smart format recognition with seamless conversion
- **Data Preservation**: All original character information maintained and enhanced with RPG mechanics
- **Enhanced Export**: Include progression data, world information, and relationships in exported cards
- **Batch Processing**: Handle multiple character cards efficiently

### **📊 Advanced Character System**
- **7-Stat System**: STR, DEX, CON, INT, WIS, CHA, plus **LCK** for critical events and fortune
- **Complex Progression**: Levels 1-100 with milestone bonuses and class features
- **Skill Mastery**: 7-tier ranking system (Novice → Grandmaster) with XP tracking and technique unlocks
- **Magic Schools**: 12 elemental schools with mastery progression and spell combinations
- **Race & Class Features**: Automatic racial bonuses and class-specific abilities
- **Visual Character Panel**: Multi-tabbed interface with stats, skills, magic, inventory, and world information

### **🏰 Comprehensive World Building**
- **Enhanced NPCs**: Full stat blocks, cultural backgrounds, relationships, and detailed inventories
- **Faction Management**: Political entities with territories, demographics, and diplomatic relations
- **Detailed Locations**: Complete with population data, services, economic information, and connections
- **Geographic Mapping**: Coordinate systems, trade routes, and territorial boundaries
- **Balanced Monsters**: Creatures with environmental adaptations, abilities, and contextual loot tables

### **📚 Intelligent Lorebook System**
- **Context Activation**: Lore triggers based on keywords, locations, characters, and story events
- **Discovery Mechanics**: Secret information revealed through progression and exploration
- **Smart Categorization**: History, religion, magic, culture, politics, and geography organization
- **Priority System**: Important lore surfaces automatically based on relevance
- **Integration**: Seamlessly works with existing SillyTavern world information

### **⭐ Otherworlder Features**
- **System Access**: Special UI notifications and game-like status messages
- **Unique Skills**: Individual powers that evolve at levels 10, 20, 50, and 100
- **Lucky Events**: LCK stat affects critical chances, rare drops, and fortunate story outcomes
- **Evolution System**: Progressive power growth with visual feedback and milestone celebrations

### **🎲 Advanced Game Mechanics**
- **Smart Dice System**: Complex expressions with advantage/disadvantage and contextual modifiers
- **Skill Progression**: XP-based advancement with visual progress tracking
- **Magic Mastery**: Spell schools with affinity systems and progressive learning
- **Technique System**: Stamina-based special abilities unlocked through skill advancement
- **Multiple Rulesets**: Support for D&D 5e, Isekai, Generic, and Custom RPG systems
- **Zero-Setup Tool Calling**: Automatically injects enhanced RPG tools into GPT-4/5, Claude, and Gemini API calls
- **Context-Aware Activation**: Smart detection of RPG content with enhanced keyword recognition
- **Real-Time Execution**: LLMs can create characters, learn skills, cast spells, manage factions, and build entire worlds instantly
- **Multi-Provider Support**: Works seamlessly across all major LLM providers with provider-specific optimizations

## 📋 Prerequisites

1. **SillyTavern** installed and running
2. **STRES Backend Server** running (see [main repository](https://github.com/arw052/stres-project))

## 🚀 Installation

### Method 1: Through SillyTavern Extensions Panel (Recommended)

1. Open SillyTavern
2. Go to **Extensions** → **Install Extension**
3. Enter this repository URL: `https://github.com/arw052/stres-sillytavern-extension-alpha`
4. Click **Install**
5. Enable the extension in the Extensions panel

### Method 2: Manual Installation

1. Clone or download this repository
2. Copy the extension files to your SillyTavern extensions directory:
   ```
   SillyTavern/public/scripts/extensions/third-party/stres/
   ```
3. Restart SillyTavern
4. Enable the extension in the Extensions panel

## ⚙️ Setup

1. **Start the STRES Backend Server** (see main repository for instructions)
2. **Configure the extension**:
   - Use `/stres_settings` to configure server URL (default: `http://localhost:8000`)
   - Enable auto-injection and other features as desired
3. **Create a campaign**:
   ```
   /stres_campaign create "My Adventure"
   ```

## 🎮 Usage

### Enhanced Slash Commands

#### **Campaign Management**
- `/stres_campaign create <name>` - Create new campaign
- `/stres_campaign load <id>` - Load existing campaign  
- `/stres_status` - Show comprehensive system status with campaign info

#### **Enhanced Character Commands**
- `/stres_create_character <name> <race> <class> [level]` - Create advanced character with full RPG stats
  - Example: `/stres_create_character "Akira Yamamoto" otherworlder mage 1`
  - Supports: human, elf, dwarf, orc, demon, beastfolk, halfling, tiefling, **otherworlder**
- `/stats` - Show detailed character stats with progression info
- `/inventory` - Show character inventory (enhanced display)

#### **Skill & Magic System**
- `/stres_learn_skill <skill_name> [category]` - Learn new skills with XP tracking
  - Example: `/stres_learn_skill "Swordsmanship" combat`
  - Categories: combat, magic, crafting, social, survival, knowledge, unique
- `/stres_cast_spell <spell_name> [target]` - Cast spells with MP cost and effects
  - Example: `/stres_cast_spell "Fireball" goblin`
  - Supports 12 magic schools: Fire, Water, Earth, Wind, Light, Dark, Spirit, Body, Time, Space, Life, Death

#### **Character Card Management**
- `/stres_import_card` - Import character cards from files (supports v2, SillyTavern, STRES, JSON)
- `/stres_export_card` - Export character to enhanced v2 format with world data

#### **World Building & Content Generation**
- `/stres_npc <culture> <role> [gender] [level]` - Generate detailed NPCs
  - Example: `/stres_npc elf merchant female 3`
- `/stres_monster <type> <level> [size] [boss]` - Generate balanced monsters
  - Example: `/stres_monster dragon 8 large true`
- `/stres_location <type> [size] [wealth]` - Generate rich locations
  - Example: `/stres_location tavern medium wealthy`
- `/stres_world` - Show world information with known NPCs and locations

#### **Lorebook Integration**
- `/stres_lorebook <keywords>` - Search lorebook entries by keywords
  - Example: `/stres_lorebook magic convergence otherworlder`
  - Supports context-aware search with priority ranking

#### **Dice & Mechanics**
- `/stres_roll <expression> [modifier] [target]` - Advanced dice rolling
  - Example: `/stres_roll 1d20 5 15`
  - Supports advantage/disadvantage, complex expressions

#### **Configuration**
- `/stres_settings` - Open comprehensive settings panel with all enhanced features

### Enhanced Visual Features

#### **Advanced Character Panel**
- **Multi-Tab Interface**: Stats, Skills, Magic, Inventory, World Info tabs
- **Real-Time Bars**: HP/MP/Stamina with dynamic coloring and critical alerts
- **7-Stat Display**: STR, DEX, CON, INT, WIS, CHA, **LCK** with modifiers
- **Skill Progression**: Visual XP bars with 7-tier ranking (Novice → Grandmaster)
- **Magic School Affinities**: Color-coded school masteries and spell lists
- **Inventory Management**: Grid-based item display with quantities
- **World Information**: Known NPCs, locations, and relationships tracking

#### **Otherworlder Special Features**
- **Unique Skill Display**: Special panel for otherworlder exclusive abilities
- **Evolution Tracking**: Visual progress for unique skill evolution stages
- **System Notifications**: Game-like status messages and alerts
- **Lucky Event Highlighting**: Special effects for LCK-based outcomes

#### **Enhanced UI Elements**
- **Toast Notifications**: Rich feedback for all tool executions with detailed results
- **Themed Styling**: Fantasy, Cyberpunk, Enhanced v2 themes with advanced RPG data support
- **Character Card Integration**: Import/Export buttons with format selection
- **Responsive Design**: Mobile-friendly interface with collapsible panels
- **Auto-Context Injection**: Character status automatically added to messages

### 🚀 Seamless LLM Integration

**The Magic Behind STRES:** When you chat about RPG content, STRES:

1. **Detects Context** - Scans for RPG keywords (tavern, combat, character, etc.)
2. **Injects Tools** - Automatically adds RPG tool definitions to your LLM API calls
3. **Real-Time Execution** - LLM calls are intercepted and tools are executed instantly
4. **Updates Everything** - Character stats, world state, and UI update automatically
5. **Visual Feedback** - Notifications show what happened behind the scenes

**Example Flows:**

#### **🎭 Character Creation & Development**
```
You: "I want to create a new otherworlder character named Akira"

/stres_create_character "Akira Yamamoto" otherworlder mage 1

STRES: Creates enhanced character with:
- 7 stats including LCK (with otherworlder bonuses)
- Starting spells and mana pool
- Unique skill placeholder (awakens at level 1)
- System access notifications enabled

→ Character panel shows full stats, progression, and otherworlder badge
```

#### **🌟 Automatic World Building**
```
You: "I enter the bustling tavern and ask the bartender about rumors"

Claude (with STRES tools): "The tavern is filled with smoke and chatter..."
[Automatically calls generate_enhanced_location for detailed tavern]
[Automatically calls generate_npc for bartender with local knowledge]
[Your world state now includes "The Prancing Pony" with full demographics]

STRES: Shows notifications:
🏪 "Created Location: The Prancing Pony (Pop: 150)"
👤 "Generated NPC: Gareth the Bartender"
📍 "Character location updated to The Prancing Pony"

→ World tab now shows new location and NPC data
```

#### **⚔️ Combat & Skill Progression**
```
You: "I practice my swordsmanship at the training grounds"

Claude: "You spend hours honing your technique..."
[Automatically calls learn_skill for swordsmanship progression]

STRES: 📚 "Skill Progress: Swordsmanship (Apprentice) - 75/100 XP"

Later: "I attack the bandit with my sword!"

Claude: "Rolling for attack..."
[Automatically calls roll_dice with swordsmanship bonus]
[Automatically calls cast_spell if using techniques]

STRES: 
🎲 "Rolled 1d20+6: [14] +6 = 20 (Success!)"
⚔️ "Used Technique: Power Strike (-5 Stamina)"

→ Character panel updates stamina and shows technique usage
```

#### **📋 Character Card Management**
```
User imports existing character card:

/stres_import_card

STRES: Detects format automatically
✅ "Character Card Imported!"
📊 "Format: v2 | Imported: 8 skills, 12 spells, 15 lore entries"

→ All data integrated with enhanced RPG mechanics
→ Original character information preserved and enhanced

Later export:

/stres_export_card

STRES: 💾 "Character Card Exported!"
📁 "File: Akira_Yamamoto_stres_v2.json"
📊 "Includes: World info, Lorebook entries, Progression data"
```

## ⚙️ Configuration

### **Quick Setup via `/stres_settings`:**

#### **🔧 Server Configuration**
- **Server URL**: STRES backend server address (default: `http://localhost:8000`)
- **Connection Testing**: Automatic server health checks and status reporting

#### **🤖 LLM Tool Integration**
- **Enable Tool Injection**: ✅ Automatically inject 20+ RPG tools into LLM API calls
- **Supported Models**: GPT-4/GPT-4 Turbo, GPT-5, Claude 3/3.5 Sonnet, Gemini 2.5 Pro
- **Context Detection**: Smart activation based on RPG keywords and content analysis
- **Provider Optimization**: Model-specific tool formatting (OpenAI, Anthropic, Google)

#### **📋 Character Cards & Import/Export**
- **Auto-Import**: Detect and import character card data automatically
- **Universal Compatibility**: Support for v2, SillyTavern, STRES native, generic JSON formats
- **Enhanced Exports**: Include world information and lorebook entries in exports
- **Data Preservation**: Maintain all original character information during conversion

#### **⚙️ RPG System Configuration**
- **Ruleset Selection**: Choose from Isekai, D&D 5e, Generic, Pathfinder, or Custom systems
- **Advanced Character Creation**: 7-stat system with racial bonuses and class features
- **Skill System**: 7-tier progression with XP tracking and technique unlocks
- **Magic Schools**: 12 elemental schools with mastery levels and spell combinations

#### **📚 Lorebook Integration**
- **Auto-Activation**: Context-aware lore surfacing based on story events
- **Priority System**: Configurable relevance ranking (1-10 scale)
- **Secret Discovery**: Hidden lore revealed through progression
- **Smart Categorization**: History, religion, magic, culture, politics, geography

#### **📊 Auto State Tracking**
- **Pattern Recognition**: Detect HP/MP changes, location updates from narrative text
- **Location Tracking**: ✅ Automatic location updates from movement descriptions
- **Health Management**: ✅ Track damage, healing, and status effects
- **Inventory Tracking**: ✅ Detect found items, equipment changes, gold transactions

#### **🎨 UI & Experience**
- **Advanced Themes**: Fantasy, Cyberpunk, Enhanced v2 with comprehensive RPG styling
- **Character HUD**: Multi-tab interface with real-time status updates
- **Notification System**: Rich toast notifications with detailed action feedback
- **Responsive Design**: Mobile-friendly with collapsible panels and touch support

#### **🌍 World Building Features**
- **Enable World Systems**: Factions, Locations, NPCs, Demographics tracking
- **Geographic Mapping**: Coordinate systems and territorial boundaries
- **Faction Management**: Political entities with diplomatic relations
- **Population Dynamics**: Detailed demographic breakdowns and cultural information

## 🤝 Compatibility

### **SillyTavern Integration**
- **Version Support**: Latest SillyTavern releases (1.11.0+)
- **Extension System**: Full compatibility with SillyTavern extension architecture
- **Settings Integration**: Uses native SillyTavern settings storage and management
- **Event Hooks**: Integrates with SillyTavern message send/receive events

### **LLM Provider Support**
#### **Enhanced Tool Calling (Tier 1)**
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-5 with full function calling support
- **Anthropic**: Claude 3 Sonnet, Claude 3.5 Sonnet with tool use capabilities
- **Google**: Gemini 2.5 Pro with function declarations support

#### **Pattern Recognition (Tier 2)**
- **All Models**: Automatic state tracking from narrative text
- **Universal Support**: Works with any LLM through intelligent text analysis
- **Fallback Mode**: Graceful degradation for models without tool support

### **Browser Compatibility**
- **Chrome/Chromium**: Full feature support (recommended)
- **Firefox**: Complete compatibility with all features
- **Safari**: Full support on macOS and iOS
- **Edge**: Complete feature set on Windows

### **File Format Support**
- **Character Cards**: v2, SillyTavern, STRES native, generic JSON
- **Import Sources**: Local files, drag-and-drop, clipboard data
- **Export Formats**: Enhanced v2 with world data, lorebook entries, progression tracking
=======
### Slash Commands

- `/stres_campaign create <name>` - Create new campaign
- `/stres_campaign load <id>` - Load existing campaign  
- `/stres_npc elf merchant female 3` - Generate NPC
- `/stres_monster dragon 8 large true` - Generate monster
- `/stres_location tavern medium wealthy` - Generate location
- `/stres_roll 1d20 5 15` - Roll dice with modifier and target
- `/stats` - Show character stats
- `/stres_settings` - Configure extension

### Visual Features

- **Character HUD**: Real-time HP/MP bars and stats display
- **Auto-injection**: Character status automatically added to messages
- **Toast Notifications**: Visual feedback for RPG actions
- **Themed UI**: Fantasy, Cyberpunk, or Minimal themes

### LLM Integration

When using compatible LLMs (GPT-4/5, Gemini 2.5 Pro, Claude), the extension automatically provides RPG tools that the AI can use:

- Generate NPCs, monsters, and locations automatically
- Track character stats and inventory changes
- Handle dice rolls and skill checks
- Maintain world consistency across sessions

## 🔧 Configuration

Access settings with `/stres_settings`:

- **Server URL**: STRES backend server address
- **Auto-injection**: Automatically inject character status into messages
- **Theme**: Visual theme (Fantasy/Cyberpunk/Minimal)
- **Auto Tool Integration**: Enable LLM tool calling (requires compatible LLM)

## 🤝 Compatibility

- **SillyTavern**: Latest version
- **LLMs**: All models supported, enhanced features with GPT-4/5, Gemini 2.5 Pro, Claude
- **Browsers**: Chrome, Firefox, Safari, Edge

## 📖 Documentation

For complete documentation, API reference, and setup guides, see the [main STRES repository](https://github.com/arw052/stres-project).

## 🐛 Troubleshooting

### **Extension Installation Issues**
- **Not Loading**: Check browser console (F12) for JavaScript errors
- **Missing Files**: Ensure all extension files are in correct directory structure
- **Version Conflicts**: Verify SillyTavern version compatibility (1.11.0+)
- **Permission Errors**: Check file permissions in extensions directory

### **Server Connection Problems**
- **Cannot Connect**: Ensure STRES backend server is running on port 8000
- **Wrong URL**: Check server URL in `/stres_settings` (default: `http://localhost:8000`)
- **Firewall Blocking**: Verify firewall allows connections to localhost:8000
- **CORS Issues**: Ensure backend server allows SillyTavern origin

### **Command Execution Issues**
- **Commands Not Working**: Ensure extension is enabled in SillyTavern Extensions panel
- **No Campaign**: Create campaign first using `/stres_campaign create "My Campaign"`
- **Server Unavailable**: Check connection with `/stres_status` command
- **Tool Integration Failing**: Verify LLM provider supports function calling

### **Character & Data Issues**
- **Character Not Loading**: Check campaign ID and character exists in database
- **Import Failures**: Verify character card format is supported (v2, SillyTavern, JSON)
- **Missing Features**: Ensure using enhanced backend endpoints (fallback to basic if needed)
- **Data Loss**: Use export function regularly to backup character progression

### **UI & Visual Problems**
- **Panel Not Showing**: Check if Character HUD is enabled in `/stres_settings`
- **Styling Issues**: Try different themes (Fantasy, Cyberpunk, Enhanced v2)
- **Mobile Display**: Use responsive settings for smaller screens
- **Performance**: Disable unnecessary visual features for better performance

### **Advanced Troubleshooting**
- **Reset Settings**: Use "Reset to Defaults" button in `/stres_settings`
- **Export Configuration**: Save settings with "Export Config" before major changes
- **Clear Data**: Clear browser cache and reload SillyTavern if issues persist
- **Debug Mode**: Enable browser developer tools to monitor API calls and responses

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with SillyTavern
5. Submit a pull request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/arw052/stres-sillytavern-extension-alpha/issues)
- **Documentation**: [Main Repository](https://github.com/arw052/stres-project)
- **Community**: [SillyTavern Discord](https://discord.gg/sillytavern)