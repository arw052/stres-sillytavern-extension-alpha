# STRES - SillyTavern RPG Enhancement System Extension

A comprehensive RPG automation extension for SillyTavern that provides character management, NPC generation, world building, and LLM tool integration for enhanced fantasy roleplay.

## 🎯 Features

- **Character Management**: Track HP, MP, stats, inventory, and location in real-time
- **NPC Generation**: Create unique NPCs with stats, skills, and backstories
- **Monster Creation**: Generate enemies with abilities and loot tables
- **Location Building**: Create detailed locations with services and connections
- **Dice Rolling**: Comprehensive dice system with advantage/disadvantage
- **World Persistence**: All generated content persists across sessions
- **LLM Tool Integration**: Automatic RPG tools for GPT-4/5, Gemini 2.5 Pro, Claude
- **Visual HUD**: Game-like character panel with HP/MP bars and stats

## 📋 Prerequisites

1. **SillyTavern** installed and running
2. **STRES Backend Server** running (see [main repository](https://github.com/YourUsername/stres-project))

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

### Extension not loading
- Check browser console for errors
- Ensure manifest.json is present and valid
- Verify SillyTavern version compatibility

### Cannot connect to server
- Ensure STRES backend server is running on specified port
- Check server URL in settings (`/stres_settings`)
- Verify firewall/network settings

### Commands not working
- Ensure extension is enabled in Extensions panel
- Create a campaign first: `/stres_campaign create <name>`
- Check server connectivity

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