# CHANGELOG

All notable changes to the STRES SillyTavern Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-01-15 - Enhanced Edition

### 🎉 Major Release: Complete RPG Automation Platform

This is a comprehensive overhaul that transforms STRES from a basic RPG helper into a complete RPG automation platform with advanced character management, world building, and seamless LLM integration.

### ✨ Added

#### 🤖 Enhanced LLM Integration
- **20+ Advanced RPG Tools**: Complete toolkit for character creation, skills, magic, world building
- **Automatic Tool Injection**: Seamlessly injects enhanced RPG tools into GPT-4/5, Claude, Gemini API calls
- **Context-Aware Activation**: Smart detection of RPG content with enhanced keyword recognition
- **Real-Time Execution**: Tools execute immediately with visual feedback and UI updates
- **Multi-Provider Support**: OpenAI, Anthropic, Google APIs with provider-specific optimizations

#### 📋 Character Card System
- **Universal Import**: Support for v2, SillyTavern, STRES native, and generic JSON character card formats
- **Automatic Detection**: Smart format recognition with seamless conversion
- **Data Preservation**: All original character information maintained and enhanced
- **Enhanced Export**: Include progression data, world information, and relationships
- **Batch Processing**: Handle multiple character cards efficiently

#### 📊 Advanced Character System
- **7-Stat System**: STR, DEX, CON, INT, WIS, CHA, plus **LCK** for critical events
- **Complex Progression**: Levels 1-100 with milestone bonuses and class features
- **Skill Mastery**: 7-tier ranking system (Novice → Grandmaster) with XP tracking
- **Magic Schools**: 12 elemental schools with mastery progression and combinations
- **Race & Class Features**: Automatic racial bonuses and class-specific abilities
- **Multi-Tab Interface**: Stats, Skills, Magic, Inventory, World information tabs

#### 🏰 Comprehensive World Building
- **Enhanced NPCs**: Full stat blocks, cultural backgrounds, relationships, detailed inventories
- **Faction Management**: Political entities with territories, demographics, diplomatic relations
- **Detailed Locations**: Population data, services, economic information, connections
- **Geographic Mapping**: Coordinate systems, trade routes, territorial boundaries
- **Balanced Monsters**: Creatures with environmental adaptations, abilities, contextual loot

#### 📚 Intelligent Lorebook System
- **Context Activation**: Lore triggers based on keywords, locations, characters, story events
- **Discovery Mechanics**: Secret information revealed through progression and exploration
- **Smart Categorization**: History, religion, magic, culture, politics, geography organization
- **Priority System**: Important lore surfaces automatically based on relevance
- **SillyTavern Integration**: Works with existing world information

#### ⭐ Otherworlder Features
- **System Access**: Special UI notifications and game-like status messages
- **Unique Skills**: Individual powers that evolve at levels 10, 20, 50, and 100
- **Lucky Events**: LCK stat affects critical chances, rare drops, fortunate outcomes
- **Evolution System**: Progressive power growth with visual feedback and celebrations

#### 🎲 Advanced Game Mechanics
- **Smart Dice System**: Complex expressions with advantage/disadvantage and modifiers
- **Skill Progression**: XP-based advancement with visual progress tracking
- **Magic Mastery**: Spell schools with affinity systems and progressive learning
- **Technique System**: Stamina-based special abilities unlocked through advancement
- **Multiple Rulesets**: D&D 5e, Isekai, Generic, and Custom RPG systems

### 🛠 Enhanced Commands

#### New Slash Commands
- `/stres_create_character <name> <race> <class> [level]` - Create enhanced characters
- `/stres_learn_skill <skill_name> [category]` - Learn skills with XP tracking
- `/stres_cast_spell <spell_name> [target]` - Cast spells with MP cost and effects
- `/stres_import_card` - Import character cards from files
- `/stres_export_card` - Export characters to enhanced v2 format
- `/stres_lorebook <keywords>` - Search lorebook entries

#### Improved Commands
- `/stres_settings` - Comprehensive settings panel with all enhanced features
- `/stres_status` - Detailed system status with campaign and character info
- `/stres_world` - Enhanced world information with NPCs and locations
- `/stats` - Detailed character stats with progression information

### 🎨 Visual Enhancements

#### Advanced Character Panel
- **Multi-Tab Interface**: Organized display of character data
- **Real-Time Bars**: HP/MP/Stamina with dynamic coloring and alerts
- **Skill Progression**: Visual XP bars with 7-tier ranking system
- **Magic School Display**: Color-coded affinities and spell organization
- **Inventory Management**: Grid-based item display with quantities
- **World Information**: Known NPCs, locations, relationships tracking

#### Enhanced UI Elements
- **Toast Notifications**: Rich feedback for all tool executions
- **Themed Styling**: Fantasy, Cyberpunk, Enhanced v2 themes
- **Character Card Integration**: Import/Export buttons with format selection
- **Responsive Design**: Mobile-friendly with collapsible panels
- **Auto-Context Injection**: Character status automatically added to messages

#### Otherworlder Special Features
- **Unique Skill Display**: Special panel for otherworlder abilities
- **Evolution Tracking**: Visual progress for skill evolution stages
- **System Notifications**: Game-like status messages and alerts
- **Lucky Event Highlighting**: Special effects for LCK-based outcomes

### ⚙️ Configuration System

#### Comprehensive Settings Panel
- **Server Configuration**: Backend URL and connection settings
- **LLM Tool Integration**: Model selection and auto-injection controls
- **Character Cards**: Import/export options and format preferences
- **RPG System Configuration**: Ruleset selection and custom rules
- **Lorebook Integration**: Auto-activation and context priority
- **Auto State Tracking**: Pattern recognition settings
- **UI & Experience**: Theme selection and visual preferences
- **World Building Features**: Enable/disable various world systems

### 🔧 Technical Improvements

#### Backend Integration
- **Enhanced API Endpoints**: Uses `/api/enhanced/` with fallback to original
- **Improved Error Handling**: Graceful degradation and error recovery
- **Better State Management**: Persistent character and world data
- **Optimized Performance**: Efficient data loading and caching

#### Code Architecture
- **Modular Design**: Separated components for maintainability
- **Enhanced Components**: Upgraded character panel and tool integration
- **Better Event Handling**: Improved SillyTavern integration
- **Comprehensive Testing**: Built-in validation and error checking

### 🔄 Changed

#### Updated Components
- **index.js**: Complete overhaul with enhanced features and commands
- **tool-integration.js**: Enhanced with 20+ tools and better LLM support
- **character-panel.js**: Replaced with advanced multi-tab interface
- **settings system**: Comprehensive configuration with all new features

#### Improved Functionality
- **Campaign Management**: Auto-create per-chat campaigns
- **Character Creation**: Enhanced with full RPG mechanics
- **World Building**: Advanced NPC, location, and faction systems
- **State Tracking**: Improved pattern recognition and auto-updates

### 🛠 Fixed

#### Stability Improvements
- **Connection Handling**: Better error recovery and retry logic
- **UI Responsiveness**: Improved performance on mobile devices
- **Data Persistence**: More reliable character and world state saving
- **Extension Loading**: Better compatibility with SillyTavern updates

#### Bug Fixes
- **Tool Execution**: Fixed issues with tool call failures
- **Character Display**: Resolved panel rendering issues
- **Settings Persistence**: Fixed configuration save/load problems
- **API Compatibility**: Improved handling of different LLM providers

### 📦 Dependencies

#### New Components
- **enhanced-character-panel.js**: Advanced character interface
- **enhanced-v2.css**: Comprehensive styling for advanced features
- **character-card-service integration**: Universal format support
- **lorebook-manager**: Context-aware lore system

### 🔐 Security

#### Data Protection
- **Secure API Calls**: Improved authentication and validation
- **Data Sanitization**: Better input validation and XSS protection
- **Privacy Controls**: Optional data sharing and export controls

### 📚 Documentation

#### New Documentation
- **GITHUB_UPDATE_GUIDE.md**: Comprehensive guide for repository management
- **Enhanced README.md**: Complete feature documentation with examples
- **API Integration Guide**: LLM tool integration documentation
- **Troubleshooting Guide**: Comprehensive problem-solving resource

#### Updated Documentation
- **Installation Instructions**: Updated for enhanced features
- **Command Reference**: Complete list of all enhanced commands
- **Configuration Guide**: Detailed settings explanations
- **Usage Examples**: Real-world scenarios and workflows

---

## [1.0.0] - 2023-12-01 - Initial Release

### ✨ Added
- Basic RPG tool integration
- Simple character panel
- Core slash commands
- Basic dice rolling
- NPC/Monster/Location generation
- Campaign management
- Simple settings panel

### 🎯 Features
- 7 basic RPG tools
- Simple character display
- Manual tool execution
- Basic SillyTavern integration

---

## Version Comparison

| Feature | v1.0.0 | v2.0.0 Enhanced |
|---------|--------|-----------------|
| RPG Tools | 7 basic | 20+ advanced |
| Character System | Basic stats | 7-stat + progression |
| Character Cards | None | Universal import/export |
| LLM Integration | Manual | Automatic injection |
| UI | Single panel | Multi-tab interface |
| World Building | Basic | Comprehensive |
| Lorebook | None | Intelligent system |
| Rulesets | Generic | Multiple systems |
| Otherworlder | None | Complete system |
| State Tracking | Manual | Automatic |

---

## Upgrade Guide

### From v1.0.0 to v2.0.0

1. **Backup Settings**: Export your current configuration
2. **Update Extension**: Pull latest changes from repository
3. **Update Backend**: Ensure STRES backend server is v2.0 compatible
4. **Reconfigure**: Review `/stres_settings` for new options
5. **Test Features**: Verify enhanced functionality works correctly

### Breaking Changes

- **Settings Format**: Some settings have been reorganized
- **API Endpoints**: Now uses enhanced endpoints with fallback
- **Character Data**: Enhanced character format (backward compatible)

### Migration Notes

- Existing campaigns and characters are preserved
- Settings may need reconfiguration for new features
- Enhanced features require backend server v2.0+

---

## Future Roadmap

### v2.1.0 (Planned)
- Enhanced mobile interface
- Additional magic schools
- Advanced faction diplomacy
- Character relationship tracking

### v2.2.0 (Planned)
- Multi-character party management
- Advanced combat automation
- Custom ruleset editor
- Enhanced world map visualization

### v3.0.0 (Future)
- AI-driven story generation
- Advanced NPC personality system
- Dynamic world events
- Cross-campaign integration