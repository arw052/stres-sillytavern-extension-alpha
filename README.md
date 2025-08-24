# STRES v2.1 Enhanced - SillyTavern RPG Enhancement System Extension

🎲 **The ultimate RPG automation platform** - Transform SillyTavern into a comprehensive RPG system with advanced character management, combat optimization, world mapping, enhanced character card support, and revolutionary LLM tool integration.

## ✨ What Makes STRES v2.1 Enhanced Special

### **🤖 Revolutionary LLM Integration**
- **20+ Advanced RPG Tools**: Complete toolkit for character creation, skills, magic, world building, and lorebooks
- **Zero-Setup Tool Calling**: Automatically injects enhanced RPG tools into GPT-4/5, Claude, and Gemini API calls
- **Context-Aware Activation**: Smart detection of RPG content with enhanced keyword recognition
- **Real-Time Execution**: LLMs can create characters, learn skills, cast spells, manage factions, and build entire worlds instantly
- **Multi-Provider Support**: Works seamlessly across all major LLM providers with provider-specific optimizations
- **Task Completion Tracking**: Intelligent XP/progression rewards based on task completion rather than attempts

### **⚔️ Combat Mode Optimization (NEW)**
- **Automatic Context Switching**: Seamlessly switches to lightweight context during combat for faster responses
- **Cost Reduction**: 90-99% token reduction during combat scenarios for massive cost savings
- **Privacy-First**: Uses SillyTavern's existing API configuration - no additional API keys needed
- **Universal Compatibility**: Works with OpenAI, Claude, OpenRouter, local models, any SillyTavern-supported provider
- **Smart Detection**: Automatically detects combat start/end from narrative context
- **Combat UI**: Visual indicators, quick action buttons, and initiative tracking
- **Turn-Based Management**: Optimized for tactical RPG combat with minimal token usage

### **🗺️ Fantasy Map Integration (NEW)**
- **Fantasy Map Generator Support**: Import and use maps from Azgaar's Fantasy Map Generator
- **Interactive Visualization**: Pan, zoom, click locations for detailed information
- **Location Tracking**: Automatic character position tracking and movement
- **Context-Aware Descriptions**: Rich location descriptions based on map data (terrain, culture, climate)
- **Travel System**: Route calculation, waypoint detection, and travel time estimation
- **Location-Based Events**: Biome-specific encounters and regional flavor text
- **Map Tools for LLMs**: Location queries, travel planning, and exploration automation

### **📋 Enhanced Character Card Compatibility**
- **Universal Import**: Support for v2, SillyTavern, STRES native, and generic JSON character card formats
- **Automatic Detection**: Smart format recognition with seamless conversion
- **Data Preservation**: All original character information maintained and enhanced with RPG mechanics
- **Enhanced Export**: Include progression data, world information, and relationships in exported cards
- **Batch Processing**: Handle multiple character cards efficiently
- **Backwards Compatibility**: Works with existing character cards while adding RPG features

### **📊 Advanced Character System**
- **7-Stat System**: STR, DEX, CON, INT, WIS, CHA, plus **LCK** for critical events and fortune
- **Complex Progression**: Levels 1-100 with milestone bonuses and class features
- **Skill Mastery**: 7-tier ranking system (Novice → Grandmaster) with XP tracking and technique unlocks
- **Magic Schools**: 12 elemental schools with mastery progression and spell combinations
- **Race & Class Features**: Automatic racial bonuses and class-specific abilities
- **Visual Character Panel**: Multi-tabbed interface with stats, skills, magic, inventory, and world information
- **Completion-Based XP**: Rewards experience for completing tasks, not just attempting them

### **🏰 Comprehensive World Building**
- **Enhanced NPCs**: Full stat blocks, cultural backgrounds, relationships, and detailed inventories
- **Faction Management**: Political entities with territories, demographics, and diplomatic relations
- **Detailed Locations**: Complete with population data, services, economic information, and connections
- **Geographic Mapping**: Coordinate systems, trade routes, and territorial boundaries with map integration
- **Balanced Monsters**: Creatures with environmental adaptations, abilities, and contextual loot tables
- **Proactive Generation**: LLMs automatically generate content as mentioned in stories

### **📚 Intelligent Lorebook System**
- **Context Activation**: Lore triggers based on keywords, locations, characters, and story events
- **Discovery Mechanics**: Secret information revealed through progression and exploration
- **Smart Categorization**: History, religion, magic, culture, politics, and geography organization
- **Priority System**: Important lore surfaces automatically based on relevance
- **Integration**: Seamlessly works with existing SillyTavern world information
- **Map-Aware Lore**: Location-based lore activation when exploring mapped areas

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
- **Automated State Tracking**: Pattern recognition for HP/MP changes, location updates, inventory changes

## 📋 Prerequisites

1. **SillyTavern** installed and running (v1.11.0+)
2. **STRES Backend Server** running (see [main repository](https://github.com/arw052/stres-project))
3. **Compatible LLM** for enhanced features (GPT-4/5, Claude, Gemini) - optional but recommended

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
   - Configure combat mode optimization (optional)
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

#### **Map Integration (NEW)**
- `/stres_map load` - Load Fantasy Map Generator JSON file
- `/stres_map show` - Display interactive map viewer
- `/stres_map travel <destination>` - Calculate travel route and time
- `/stres_map location <name>` - Get detailed location information

#### **Combat Commands**
- `/stres_combat start` - Manually initiate combat mode
- `/stres_combat end` - Manually end combat mode
- `/stres_combat status` - Show current combat state

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

### 🚀 Seamless LLM Integration

**The Magic Behind STRES:** When you chat about RPG content, STRES:

1. **Detects Context** - Scans for RPG keywords (tavern, combat, character, etc.)
2. **Switches Mode** - Automatically optimizes context for combat vs exploration
3. **Injects Tools** - Adds appropriate tool definitions to your LLM API calls
4. **Real-Time Execution** - LLM calls are intercepted and tools are executed instantly
5. **Updates Everything** - Character stats, world state, map position, and UI update automatically
6. **Visual Feedback** - Notifications show what happened behind the scenes

### **Combat Mode Optimization (NEW)**

#### **Automatic Context Switching**
When combat is detected:
- **Lightweight Context**: Reduces 50k+ tokens to ~2k tokens
- **Fast Responses**: Uses optimized settings for quicker AI responses
- **Cost Savings**: 90-99% reduction in API costs during combat
- **Visual Indicators**: Shows "⚔️ Combat Mode" with round tracking

#### **Smart Combat Detection**
```
Player: "I attack the goblin with my sword"
→ STRES detects combat automatically
→ Switches to combat context
→ LLM responds faster and cheaper
→ Returns to full context when combat ends
```

#### **Configuration Options**
- Enable/disable combat mode optimization
- Set number of messages to keep during combat (1-10)
- Configure response length limits
- Toggle UI enhancements

### **Map Integration Features (NEW)**

#### **Interactive World Mapping**
```
/stres_map load
→ Import Fantasy Map Generator JSON
→ Display interactive map with locations
→ Click locations for detailed information
→ Track character position visually
```

#### **Location-Aware Context**
```
Player: "I travel to the capital city"
→ STRES calculates route and travel time
→ Generates location description from map data
→ Updates character location automatically
→ Triggers location-specific events
```

#### **Map Tools for LLMs**
- `get_location_info` - Detailed location data
- `calculate_travel_route` - Route planning
- `find_nearby_locations` - Exploration assistance
- `start_travel` - Travel management

### **Example Usage Flows:**

#### **🎭 Character Creation & Development**
```
You: "I want to create a new otherworlder character named Akira"

Claude (with STRES tools): "Let me create this character for you..."
[Automatically calls create_character with otherworlder features]

STRES: ✨ "Created Character: Akira Yamamoto (Level 1) 🌟 (Otherworlder)"
→ Character panel shows full stats, progression, and otherworlder badge
→ Unique skill placeholder ready for awakening
```

#### **⚔️ Combat Optimization**
```
You: "I draw my sword and attack the orc!"

STRES: [Detects combat] → Switches to combat mode
Claude: "Rolling for attack..." [Fast response with optimized context]
[Automatically rolls dice and applies damage]

STRES: ⚔️ "Combat Mode Active" 
🎲 "Rolled 1d20+5: 18 - Hit! Damage: 1d8+3: 7"
→ Combat resolved quickly and cheaply
```

#### **🗺️ Map Exploration**
```
You: "I want to travel to the nearest town"

Claude (with map tools): "Looking at your surroundings..."
[Calls find_nearby_locations and calculate_travel_route]

STRES: 🗺️ "Nearest town: Millbrook (8 miles north, 1 day travel)"
📍 "Route calculated through Greenwood Forest"
→ Map shows travel route and destination details
```

#### **🌟 Automatic World Building**
```
You: "I enter the bustling tavern and ask the bartender about rumors"

Claude (with STRES tools): "The tavern is filled with smoke and chatter..."
[Automatically calls generate_enhanced_location for detailed tavern]
[Automatically calls generate_npc for bartender with local knowledge]

STRES: 🏪 "Created Location: The Prancing Pony (Pop: 150)"
👤 "Generated NPC: Gareth the Bartender"
→ World tab now shows new location and NPC data
```

#### **📋 Character Card Management**
```
User imports existing character card:

/stres_import_card

STRES: ✅ "Character Card Imported!"
📊 "Format: v2 | Imported: 8 skills, 12 spells, 15 lore entries"
→ All data integrated with enhanced RPG mechanics
→ Original character information preserved and enhanced
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

#### **⚔️ Combat Mode Settings (NEW)**
- **Enable Combat Optimization**: Automatic context switching during combat
- **Messages to Keep**: Number of recent messages during combat (1-10)
- **Disable World Info in Combat**: Temporarily remove world info during fights
- **Combat Response Length**: Token limit for combat responses (50-200)
- **Show Combat Notifications**: Visual feedback when switching modes

#### **🗺️ Map Integration (NEW)**
- **Enable Map Features**: Interactive map viewing and location tracking
- **Map Context Injection**: Include location details in character status
- **Travel System**: Automatic route calculation and travel time estimation
- **Location-Based Events**: Biome-specific encounters and regional flavor

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
- **Task Completion**: ✅ Award XP for completing tasks, not just attempts

#### **🎨 UI & Experience**
- **Advanced Themes**: Fantasy, Cyberpunk, Enhanced v2 with comprehensive RPG styling
- **Character HUD**: Multi-tab interface with real-time status updates
- **Notification System**: Rich toast notifications with detailed action feedback
- **Responsive Design**: Mobile-friendly with collapsible panels and touch support

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
- **OpenRouter**: Full support for all OpenRouter models with function calling

#### **Pattern Recognition (Tier 2)**
- **All Models**: Automatic state tracking from narrative text
- **Universal Support**: Works with any LLM through intelligent text analysis
- **Local Models**: Ollama, LM Studio, and other local providers
- **Fallback Mode**: Graceful degradation for models without tool support

### **Combat Mode Compatibility**
- **All APIs**: Works with any SillyTavern-configured API
- **Privacy-First**: No additional API keys required
- **Cost Optimization**: Works with paid and free providers
- **Local Models**: Significant speed improvements for local inference

### **Map Integration Support**
- **Fantasy Map Generator**: Full JSON import support
- **File Formats**: SVG visual maps, GeoJSON routes/regions
- **Browser Support**: Canvas/SVG rendering in all modern browsers
- **Mobile Friendly**: Touch controls for map navigation

### **Browser Compatibility**
- **Chrome/Chromium**: Full feature support (recommended)
- **Firefox**: Complete compatibility with all features
- **Safari**: Full support on macOS and iOS
- **Edge**: Complete feature set on Windows

### **File Format Support**
- **Character Cards**: v2, SillyTavern, STRES native, generic JSON
- **Map Files**: Fantasy Map Generator JSON, SVG, GeoJSON
- **Import Sources**: Local files, drag-and-drop, clipboard data
- **Export Formats**: Enhanced v2 with world data, lorebook entries, progression tracking

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

### **Combat Mode Issues**
- **Not Activating**: Check if combat mode is enabled in settings
- **Slow Responses**: Verify token limits are set appropriately (150 recommended)
- **Context Too Large**: Reduce number of messages kept during combat
- **API Errors**: Combat mode works with your existing API - no additional setup needed

### **Map Integration Issues**
- **Map Not Loading**: Verify JSON file is from Fantasy Map Generator
- **Display Problems**: Check browser supports Canvas/SVG rendering
- **Location Not Found**: Ensure location names match those in the map data
- **Performance Issues**: Large maps may require reduced zoom/detail levels

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

## 📚 Documentation

For complete documentation, API reference, and setup guides, see the [main STRES repository](https://github.com/arw052/stres-project).

## 🆕 What's New in v2.1

### **Combat Mode Optimization**
- Automatic context switching during combat
- 90-99% token reduction for faster, cheaper combat
- Works with any SillyTavern-configured API
- Visual combat indicators and turn tracking

### **Fantasy Map Integration**
- Import maps from Fantasy Map Generator
- Interactive map viewing with location tracking
- Automatic location descriptions and travel calculations
- Map-aware context injection and events

### **Enhanced Task Completion**
- XP rewards based on completing tasks, not attempts
- Quality-based progression (critical success = bonus XP)
- Automatic detection of task start/completion
- Failure learning system (reduced XP for failed attempts)

### **Improved LLM Integration**
- Proactive tool usage by LLMs
- Better context detection and tool selection
- Enhanced provider compatibility (OpenRouter, local models)
- Smarter pattern recognition for state updates

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