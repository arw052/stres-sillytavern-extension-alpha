(function() {
    'use strict';
    
    const extensionName = "stres";
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
    
    const defaultSettings = {
        serverUrl: "http://localhost:8000",
        campaignId: null,
        chatCampaigns: {}, // Maps chat IDs to campaign IDs
        autoInjection: {
            enabled: true,
            mode: "basic",
            frequency: "every_message"
        },
        ui: {
            theme: "fantasy",
            showHUD: true,
            panelPosition: "right"
        },
        autoToolInjection: {
            enabled: true,
            enabledModels: ["gpt-4", "gpt-5", "gemini-2.5-pro", "claude"]
        },
        autoStateTracking: {
            enabled: true,
            trackLocation: true,
            trackHealth: true,
            trackInventory: true
        }
    };

    let stresClient;
    let characterPanel;
    let autoInjector;
    let commandProcessor;
    let toolIntegration;

    // STRES API Client
    class STRESClient {
        constructor(baseUrl) {
            this.baseUrl = baseUrl;
            this.apiPrefix = '/api';
        }

        async request(endpoint, options = {}) {
            const url = `${this.baseUrl}${this.apiPrefix}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            return response.json();
        }

        async getCampaigns() {
            return this.request('/campaigns/');
        }

        async getCampaign(campaignId) {
            return this.request(`/campaigns/${campaignId}`);
        }

        async createCampaign(campaign) {
            return this.request('/campaigns/', {
                method: 'POST',
                body: JSON.stringify(campaign)
            });
        }

        async deleteCampaign(campaignId) {
            return this.request(`/campaigns/${campaignId}`, {
                method: 'DELETE'
            });
        }

        async getCharacters(campaignId) {
            return this.request(`/characters/${campaignId}/`);
        }

        async getCharacter(campaignId, characterId) {
            return this.request(`/characters/${campaignId}/${characterId}`);
        }

        async createCharacter(character) {
            return this.request('/characters/', {
                method: 'POST',
                body: JSON.stringify(character)
            });
        }

        async updateCharacter(campaignId, characterId, update) {
            return this.request(`/characters/${campaignId}/${characterId}`, {
                method: 'PUT',
                body: JSON.stringify(update)
            });
        }

        // Tool calling methods
        async getToolDefinitions() {
            return this.request('/tools/definitions');
        }

        async executeTool(toolName, parameters) {
            return this.request('/tools/execute', {
                method: 'POST',
                body: JSON.stringify({
                    tool_name: toolName,
                    parameters: parameters
                })
            });
        }

        async generateNPC(campaignId, culture, role, options = {}) {
            return this.executeTool('generate_npc', {
                campaign_id: campaignId,
                culture,
                role,
                ...options
            });
        }

        async generateMonster(campaignId, monsterType, level, options = {}) {
            return this.executeTool('generate_monster', {
                campaign_id: campaignId,
                monster_type: monsterType,
                level,
                ...options
            });
        }

        async generateLocation(campaignId, locationType, options = {}) {
            return this.executeTool('generate_location', {
                campaign_id: campaignId,
                location_type: locationType,
                ...options
            });
        }

        async rollDice(expression, options = {}) {
            return this.executeTool('roll_dice', {
                dice_expression: expression,
                ...options
            });
        }
    }

    // Character Panel Component
    class CharacterPanel {
        constructor(client, settings) {
            this.client = client;
            this.settings = settings;
            this.character = null;
        }

        setCharacter(character) {
            this.character = character;
            this.update();
        }

        render(container) {
            const panel = document.createElement('div');
            panel.id = 'stres-character-panel';
            panel.className = `stres-panel ${this.settings.ui.panelPosition}`;
            panel.innerHTML = `
                <div class="stres-panel-header">
                    <h3>Character</h3>
                    <button class="stres-panel-toggle">_</button>
                </div>
                <div class="stres-panel-content">
                    <div id="stres-character-stats"></div>
                    <div id="stres-character-inventory"></div>
                    <div id="stres-character-location"></div>
                </div>
            `;
            container.appendChild(panel);

            panel.querySelector('.stres-panel-toggle').addEventListener('click', () => {
                panel.classList.toggle('collapsed');
            });

            this.panel = panel;
            this.update();
        }

        update() {
            if (!this.panel || !this.character) return;

            const data = this.character.data;
            const statsDiv = this.panel.querySelector('#stres-character-stats');
            const inventoryDiv = this.panel.querySelector('#stres-character-inventory');
            const locationDiv = this.panel.querySelector('#stres-character-location');

            statsDiv.innerHTML = `
                <div class="stres-stat-group">
                    <div class="stres-stat">
                        <span class="label">HP:</span>
                        <span class="value">${data.stats?.hp?.current || 0}/${data.stats?.hp?.max || 100}</span>
                        <div class="stres-bar">
                            <div class="stres-bar-fill hp" style="width: ${((data.stats?.hp?.current || 0) / (data.stats?.hp?.max || 100)) * 100}%"></div>
                        </div>
                    </div>
                    <div class="stres-stat">
                        <span class="label">MP:</span>
                        <span class="value">${data.stats?.mp?.current || 0}/${data.stats?.mp?.max || 50}</span>
                        <div class="stres-bar">
                            <div class="stres-bar-fill mp" style="width: ${((data.stats?.mp?.current || 0) / (data.stats?.mp?.max || 50)) * 100}%"></div>
                        </div>
                    </div>
                </div>
                <div class="stres-stat-row">
                    <span>Level ${data.level}</span>
                    <span>XP: ${data.experience}</span>
                </div>
                <div class="stres-stat-row">
                    <span>Gold: ${data.gold}g</span>
                </div>
            `;

            const itemCount = data.inventory?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
            inventoryDiv.innerHTML = `
                <div class="stres-inventory-summary">
                    Items: ${itemCount}
                </div>
            `;

            locationDiv.innerHTML = `
                <div class="stres-location">
                    <span class="icon">📍</span>
                    <span>${data.location || 'Unknown'}</span>
                </div>
            `;
        }
    }

    // Auto Injector Component
    class AutoInjector {
        constructor(client, settings) {
            this.client = client;
            this.settings = settings;
            this.character = null;
        }

        setCharacter(character) {
            this.character = character;
        }

        injectContext(messageData) {
            if (!this.settings.autoInjection.enabled || !this.character) {
                return;
            }

            const injection = this.generateInjection();
            if (injection) {
                messageData.message = `${injection}\\n\\n${messageData.message}`;
            }
        }

        generateInjection() {
            if (!this.character || !this.character.data) return '';

            const data = this.character.data;
            
            if (this.settings.autoInjection.mode === 'basic') {
                return `[Status] HP: ${data.stats.hp.current}/${data.stats.hp.max} | MP: ${data.stats.mp.current}/${data.stats.mp.max} | Location: ${data.location} | Gold: ${data.gold}g`;
            } else if (this.settings.autoInjection.mode === 'detailed') {
                const items = data.inventory.map(i => `${i.item}${i.quantity > 1 ? ` x${i.quantity}` : ''}`).slice(0, 3).join(', ');
                return `[Character Status]
HP: ${data.stats.hp.current}/${data.stats.hp.max} | MP: ${data.stats.mp.current}/${data.stats.mp.max} | STR: ${data.stats.strength} | DEX: ${data.stats.dexterity} | INT: ${data.stats.intelligence}
Location: ${data.location} | Gold: ${data.gold}g
Notable Items: ${items || 'None'}
Active Effects: None`;
            }
            
            return '';
        }
    }

    async function loadSettings() {
        // Access SillyTavern's extension_settings
        const settings = window.extension_settings || extension_settings;
        
        if (typeof settings === 'undefined') {
            console.error("[STRES] extension_settings not available");
            return;
        }
        
        settings[extensionName] = settings[extensionName] || {};
        
        if (Object.keys(settings[extensionName]).length === 0) {
            Object.assign(settings[extensionName], defaultSettings);
        }
        
        // Make settings globally accessible for our extension
        window.extension_settings = settings;
        
        console.log("[STRES] Settings loaded:", settings[extensionName]);
    }

    // This function is no longer used - initialization moved to main jQuery block

    // Old function removed - slash commands now registered in main initialization

    async function showCharacterStats(args) {
        const settings = window.extension_settings || extension_settings;
        if (!settings[extensionName]?.campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        try {
            const characters = await stresClient.getCharacters(settings[extensionName].campaignId);
            const playerChar = characters.find(c => c.is_player);
            
            if (!playerChar) {
                return "No player character found. Create one first.";
            }

            const data = playerChar.data;
            return `**${playerChar.name} - Level ${data.level}**
────────────────
**Stats:**
HP: ${data.stats.hp.current}/${data.stats.hp.max}
MP: ${data.stats.mp.current}/${data.stats.mp.max}
STR: ${data.stats.strength} | DEX: ${data.stats.dexterity} | INT: ${data.stats.intelligence}
WIS: ${data.stats.wisdom} | CON: ${data.stats.constitution} | CHA: ${data.stats.charisma}

**Progress:**
Experience: ${data.experience}
Gold: ${data.gold}g
Location: ${data.location}

**Skills:** ${data.skills?.join(', ') || 'None'}`;
        } catch (error) {
            return `Error retrieving character stats: ${error.message}`;
        }
    }

    async function showInventory(args) {
        return "Inventory feature coming soon!";
    }

    async function showWorldInfo(args) {
        return "World info feature coming soon!";
    }

    async function manageCampaign(args) {
        const settings = window.extension_settings || extension_settings;
        
        if (args.length === 0) {
            try {
                const campaigns = await stresClient.getCampaigns();
                let response = "Available campaigns:\\n";
                campaigns.forEach(c => {
                    response += `- ${c.name} (ID: ${c.id})\\n`;
                });
                response += "\\nUse '/stres_campaign create <name>' or '/stres_campaign load <id>'";
                return response;
            } catch (error) {
                return `Error: Cannot connect to STRES server at ${settings[extensionName]?.serverUrl || 'localhost:8000'}. Is it running?`;
            }
        }
        
        const action = args[0];
        const name = args.slice(1).join(' ');
        
        try {
            switch(action) {
                case 'create':
                    if (!name) return "Please provide a campaign name";
                    const newCampaign = await stresClient.createCampaign({ name, description: "" });
                    settings[extensionName].campaignId = newCampaign.id;
                    if (typeof saveSettingsDebounced === 'function') {
                        saveSettingsDebounced();
                    }
                    await loadCampaign(newCampaign.id);
                    return `Campaign '${name}' created and loaded`;
                    
                case 'load':
                    if (!name) return "Please provide a campaign ID";
                    await loadCampaign(name);
                    settings[extensionName].campaignId = name;
                    if (typeof saveSettingsDebounced === 'function') {
                        saveSettingsDebounced();
                    }
                    return `Campaign loaded`;
                    
                case 'delete':
                    if (!name) return "Please provide a campaign ID";
                    await stresClient.deleteCampaign(name);
                    if (settings[extensionName].campaignId === name) {
                        settings[extensionName].campaignId = null;
                        if (typeof saveSettingsDebounced === 'function') {
                            saveSettingsDebounced();
                        }
                    }
                    return `Campaign deleted`;
                    
                default:
                    return "Unknown action. Use 'create', 'load', or 'delete'";
            }
        } catch (error) {
            return `Error: ${error.message}`;
        }
    }

    async function generateNPC(args) {
        if (args.length < 2) {
            return "Usage: /stres_npc <culture> <role> [gender] [level]\\nExample: /stres_npc elf merchant female 3";
        }
        
        const settings = window.extension_settings || extension_settings;
        if (!settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        const [culture, role, gender, level] = args;
        try {
            const result = await stresClient.generateNPC(
                settings[extensionName].campaignId,
                culture,
                role,
                { gender, level: parseInt(level) || 1 }
            );
            
            if (result.success) {
                const npc = result.result.npc;
                return `**${npc.name}** - ${npc.culture} ${npc.role} (Level ${npc.level})\\n${npc.notable_items?.length > 0 ? 'Notable items: ' + npc.notable_items.join(', ') : 'Basic equipment'}`;
            } else {
                return `Failed to generate NPC: ${result.error || 'Unknown error'}`;
            }
        } catch (error) {
            return `Error generating NPC: ${error.message}`;
        }
    }

    async function generateMonster(args) {
        if (args.length < 2) {
            return "Usage: /stres_monster <type> <level> [size] [boss]\\nExample: /stres_monster dragon 5 large true";
        }
        
        const settings = window.extension_settings || extension_settings;
        if (!settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        const [type, level, size, isBoss] = args;
        try {
            const result = await stresClient.generateMonster(
                settings[extensionName].campaignId,
                type,
                parseInt(level) || 1,
                { size: size || 'medium', is_boss: isBoss === 'true' }
            );
            
            if (result.success) {
                const monster = result.result.monster;
                return `**${monster.name}** - ${monster.size} ${monster.type} (Level ${monster.level}${monster.is_boss ? ' BOSS' : ''})\\nHP: ${monster.hp}\\nAbilities: ${monster.abilities?.join(', ') || 'None'}`;
            } else {
                return `Failed to generate monster: ${result.error || 'Unknown error'}`;
            }
        } catch (error) {
            return `Error generating monster: ${error.message}`;
        }
    }

    async function generateLocation(args) {
        if (args.length < 1) {
            return "Usage: /stres_location <type> [name] [size] [wealth]\\nExample: /stres_location tavern medium wealthy";
        }
        
        const settings = window.extension_settings || extension_settings;
        if (!settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        const [type, size, wealth] = args;
        try {
            const result = await stresClient.generateLocation(
                settings[extensionName].campaignId,
                type,
                { size: size || 'medium', wealth_level: wealth || 'comfortable' }
            );
            
            if (result.success) {
                const location = result.result.location;
                return `**${location.name}** - ${location.type} (${location.size}, ${location.wealth_level})\\n${location.description}\\nServices: ${location.services?.join(', ') || 'None'}`;
            } else {
                return `Failed to generate location: ${result.error || 'Unknown error'}`;
            }
        } catch (error) {
            return `Error generating location: ${error.message}`;
        }
    }

    async function rollDice(args) {
        if (args.length < 1) {
            return "Usage: /stres_roll <expression> [modifier] [target]\\nExample: /stres_roll 1d20 5 15";
        }
        
        const [expression, modifier, target] = args;
        try {
            const result = await stresClient.rollDice(expression, {
                modifier: parseInt(modifier) || 0,
                target_number: parseInt(target) || undefined,
                description: "Manual roll"
            });
            
            if (result.success) {
                const roll = result.result;
                let output = `🎲 **${roll.expression}**: [${roll.rolls?.join(', ')}]`;
                if (roll.modifier !== 0) output += ` + ${roll.modifier}`;
                output += ` = **${roll.total}**`;
                if (roll.target !== undefined) {
                    output += ` (Target: ${roll.target} - ${roll.success_check ? '**SUCCESS**' : '**FAILURE**'})`;
                }
                return output;
            } else {
                return `Failed to roll dice: ${result.error || 'Unknown error'}`;
            }
        } catch (error) {
            return `Error rolling dice: ${error.message}`;
        }
    }

    async function showSTRESStatus(args) {
        try {
            const context = SillyTavern.getContext();
            const settings = context.extensionSettings || window.extension_settings;
            
            // Get current chat info
            const chatMetadata = context.chatMetadata || {};
            const currentChatId = context.chatId || chatMetadata.chat_id || 'No active chat';
            const chatName = context.chatName || chatMetadata.chat_name || 'Unknown';
            
            // Get campaign info
            const campaignId = settings[extensionName]?.campaignId;
            const chatCampaigns = settings[extensionName]?.chatCampaigns || {};
            const totalCampaigns = Object.keys(chatCampaigns).length;
            
            // Check server status
            let serverStatus = '❌ Not Connected';
            let campaignInfo = '❌ No Campaign';
            let characterInfo = '❌ No Character';
            
            try {
                const healthResponse = await fetch(`${settings[extensionName].serverUrl}/health`);
                if (healthResponse.ok) {
                    serverStatus = '✅ Connected';
                    
                    if (campaignId) {
                        try {
                            const campaign = await stresClient.getCampaign(campaignId);
                            const characters = await stresClient.getCharacters(campaignId);
                            
                            campaignInfo = `✅ "${campaign.name}" (ID: ${campaignId})`;
                            
                            if (characters.length > 0) {
                                const playerChar = characters.find(c => c.is_player);
                                if (playerChar) {
                                    const data = playerChar.data;
                                    characterInfo = `✅ ${playerChar.name} (Level ${data.level}) - HP: ${data.stats.hp.current}/${data.stats.hp.max}`;
                                } else {
                                    characterInfo = `✅ ${characters.length} NPCs available`;
                                }
                            }
                        } catch (error) {
                            campaignInfo = `❌ Campaign Error: ${error.message}`;
                        }
                    }
                }
            } catch (error) {
                serverStatus = `❌ Server Error: ${error.message}`;
            }
            
            return `## 🎭 STRES Status
────────────────────────────────
**🌐 Server:** ${serverStatus}
**📡 Server URL:** ${settings[extensionName]?.serverUrl || 'Not configured'}

**💬 Current Chat:** "${chatName}" (${currentChatId})
**🗺️ Campaign:** ${campaignInfo}
**👤 Character:** ${characterInfo}

**📊 Statistics:**
• Total Chat Campaigns: ${totalCampaigns}
• Auto-injection: ${settings[extensionName]?.autoInjection?.enabled ? '✅ Enabled' : '❌ Disabled'}
• Tool Calling: ${settings[extensionName]?.autoToolInjection?.enabled ? '✅ Enabled' : '❌ Disabled'}

**🎮 Available Commands:**
• \`/stres_status\` - Show this status
• \`/stres_npc <culture> <role>\` - Generate NPC
• \`/stres_monster <type> <level>\` - Generate monster
• \`/stres_location <type>\` - Generate location
• \`/stres_roll <dice>\` - Roll dice
• \`/stats\` - Show character stats
• \`/stres_settings\` - Extension settings

*Campaign auto-created for this chat. Switch chats to switch campaigns!*`;
            
        } catch (error) {
            return `❌ **STRES Status Error:** ${error.message}`;
        }
    }

    async function showSettings(args) {
        const settings = window.extension_settings || extension_settings;
        const html = `
            <div class="stres-settings">
                <h3>STRES Settings</h3>
                <div>
                    <label>Server URL: <input type="text" id="stres-server-url" value="${settings[extensionName].serverUrl}"></label>
                </div>
                <div>
                    <label>Auto-injection: <input type="checkbox" id="stres-auto-inject" ${settings[extensionName].autoInjection.enabled ? 'checked' : ''}></label>
                </div>
                <div>
                    <label>Theme: 
                        <select id="stres-theme">
                            <option value="fantasy" ${settings[extensionName].ui.theme === 'fantasy' ? 'selected' : ''}>Fantasy</option>
                            <option value="cyberpunk" ${settings[extensionName].ui.theme === 'cyberpunk' ? 'selected' : ''}>Cyberpunk</option>
                            <option value="minimal" ${settings[extensionName].ui.theme === 'minimal' ? 'selected' : ''}>Minimal</option>
                        </select>
                    </label>
                </div>
                <button onclick="saveSTRESSettings()">Save Settings</button>
            </div>
        `;
        return html;
    }

    function setupUI(extensionSettings) {
        const settings = extensionSettings || window.extension_settings;
        
        try {
            const container = document.createElement('div');
            container.id = 'stres-container';
            container.className = `stres-theme-${settings[extensionName].ui.theme}`;
            document.body.appendChild(container);
            
            if (settings[extensionName].ui.showHUD && characterPanel && typeof characterPanel.render === 'function') {
                characterPanel.render(container);
            }
        } catch (error) {
            console.log("[STRES] UI setup skipped:", error.message);
        }
        
        window.saveSTRESSettings = function() {
            const currentSettings = window.extension_settings || extension_settings;
            currentSettings[extensionName].serverUrl = document.getElementById('stres-server-url').value;
            currentSettings[extensionName].autoInjection.enabled = document.getElementById('stres-auto-inject').checked;
            currentSettings[extensionName].ui.theme = document.getElementById('stres-theme').value;
            
            // Use SillyTavern's save function
            if (typeof saveSettingsDebounced === 'function') {
                saveSettingsDebounced();
            } else if (typeof saveExtensionSettings === 'function') {
                saveExtensionSettings();
            }
            
            console.log("[STRES] Settings saved");
            location.reload();
        };
    }

    async function loadCampaign(campaignId) {
        try {
            const campaign = await stresClient.getCampaign(campaignId);
            const characters = await stresClient.getCharacters(campaignId);
            
            if (characters.length > 0) {
                const playerChar = characters.find(c => c.is_player) || characters[0];
                if (characterPanel && characterPanel.setCharacter) {
                    characterPanel.setCharacter(playerChar);
                }
                if (autoInjector && autoInjector.setCharacter) {
                    autoInjector.setCharacter(playerChar);
                }
            }
            
            console.log(`[STRES] Campaign '${campaign.name}' loaded`);
        } catch (error) {
            console.error("[STRES] Failed to load campaign:", error);
        }
    }

    async function initializeChatCampaign(context) {
        try {
            // Get current chat info from SillyTavern
            const chatMetadata = context.chatMetadata || {};
            const currentChatId = context.chatId || chatMetadata.chat_id;
            
            if (!currentChatId) {
                console.log("[STRES] No active chat, skipping campaign initialization");
                return;
            }
            
            console.log(`[STRES] Initializing campaign for chat: ${currentChatId}`);
            
            // Check if we already have a campaign for this chat
            const settings = context.extensionSettings;
            if (!settings[extensionName].chatCampaigns) {
                settings[extensionName].chatCampaigns = {};
            }
            
            let campaignId = settings[extensionName].chatCampaigns[currentChatId];
            
            if (!campaignId) {
                // Create new campaign for this chat
                const chatName = context.chatName || chatMetadata.chat_name || `Chat-${currentChatId}`;
                const campaignName = `Campaign: ${chatName}`;
                
                try {
                    const newCampaign = await stresClient.createCampaign({ 
                        name: campaignName, 
                        description: `Auto-created for SillyTavern chat: ${chatName}` 
                    });
                    
                    campaignId = newCampaign.id;
                    settings[extensionName].chatCampaigns[currentChatId] = campaignId;
                    settings[extensionName].campaignId = campaignId; // Set as current
                    
                    if (context.saveSettingsDebounced) {
                        context.saveSettingsDebounced();
                    }
                    
                    console.log(`[STRES] Created new campaign '${campaignName}' (ID: ${campaignId}) for chat ${currentChatId}`);
                } catch (error) {
                    console.error("[STRES] Failed to create campaign for chat:", error);
                    return;
                }
            } else {
                // Load existing campaign
                settings[extensionName].campaignId = campaignId;
                await loadCampaign(campaignId);
                console.log(`[STRES] Loaded existing campaign (ID: ${campaignId}) for chat ${currentChatId}`);
            }
            
        } catch (error) {
            console.error("[STRES] Failed to initialize chat campaign:", error);
        }
    }

    // Proper SillyTavern extension initialization
    jQuery(async () => {
        console.log("[STRES] Extension starting...");
        
        // Wait for SillyTavern to be ready
        const context = SillyTavern.getContext();
        const { extensionSettings, saveSettingsDebounced, eventSource, event_types, getContext } = context;
        
        console.log("[STRES] SillyTavern context obtained:", {
            extensionSettings: typeof extensionSettings,
            saveSettingsDebounced: typeof saveSettingsDebounced,
            SlashCommandParser: typeof window.SlashCommandParser,
            SlashCommand: typeof window.SlashCommand,
            registerSlashCommand: typeof context.registerSlashCommand,
            contextSlashCommandParser: typeof context.SlashCommandParser,
            contextSlashCommand: typeof context.SlashCommand,
            contextKeys: Object.keys(context).slice(0, 20) // Show first 20 keys
        });
        
        // Initialize settings
        if (!extensionSettings[extensionName]) {
            extensionSettings[extensionName] = structuredClone(defaultSettings);
            saveSettingsDebounced();
        }
        
        // Initialize STRES client
        stresClient = new STRESClient(extensionSettings[extensionName].serverUrl);
        
        // Try different slash command registration methods
        const registerSlashCommand = context.registerSlashCommand || window.registerSlashCommand;
        const SlashCommandParser = context.SlashCommandParser || window.SlashCommandParser;
        const SlashCommand = context.SlashCommand || window.SlashCommand;
        
        if (typeof SlashCommandParser !== 'undefined' && typeof SlashCommand !== 'undefined') {
            console.log("[STRES] Using modern SlashCommandParser.addCommandObject method");
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_campaign',
                callback: manageCampaign,
                helpString: 'STRES campaign management - Usage: /stres_campaign create|load|delete <name>'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_npc',
                callback: generateNPC,
                helpString: 'Generate NPC - Usage: /stres_npc <culture> <role> [gender] [level]'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_monster',
                callback: generateMonster,
                helpString: 'Generate monster - Usage: /stres_monster <type> <level> [size] [boss]'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_location',
                callback: generateLocation,
                helpString: 'Generate location - Usage: /stres_location <type> [size] [wealth]'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_roll',
                callback: rollDice,
                helpString: 'Roll dice - Usage: /stres_roll <expression> [modifier] [target]'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_settings',
                callback: showSettings,
                helpString: 'STRES settings panel'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_status',
                callback: showSTRESStatus,
                helpString: 'Show STRES status and current campaign info'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stats',
                callback: showCharacterStats,
                helpString: 'Show character stats'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'inventory',
                callback: showInventory,
                helpString: 'Show character inventory'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_world',
                callback: showWorldInfo,
                helpString: 'Show STRES world information'
            }));
            
            console.log("[STRES] Slash commands registered successfully using SlashCommandParser");
        } else if (typeof registerSlashCommand === 'function') {
            console.log("[STRES] Using legacy registerSlashCommand function");
            
            registerSlashCommand('stres_campaign', manageCampaign, [], 'STRES campaign management', true, true);
            registerSlashCommand('stres_npc', generateNPC, [], 'Generate NPC', true, true);
            registerSlashCommand('stres_monster', generateMonster, [], 'Generate monster', true, true);
            registerSlashCommand('stres_location', generateLocation, [], 'Generate location', true, true);
            registerSlashCommand('stres_roll', rollDice, [], 'Roll dice', true, true);
            registerSlashCommand('stres_settings', showSettings, [], 'STRES settings', true, true);
            registerSlashCommand('stres_status', showSTRESStatus, [], 'STRES status info', true, true);
            registerSlashCommand('stats', showCharacterStats, [], 'Show character stats', true, true);
            registerSlashCommand('inventory', showInventory, [], 'Show character inventory', true, true);
            registerSlashCommand('stres_world', showWorldInfo, [], 'Show STRES world information', true, true);
            
            console.log("[STRES] Slash commands registered successfully using registerSlashCommand");
        } else {
            console.error("[STRES] No slash command registration method found:", {
                registerSlashCommand: typeof registerSlashCommand,
                SlashCommandParser: typeof SlashCommandParser,
                SlashCommand: typeof SlashCommand
            });
        }
        
        // Setup UI if needed
        setupUI(extensionSettings);
        
        // Auto-create/load campaign based on current chat
        await initializeChatCampaign(context);
        
        // Listen for chat changes to switch campaigns
        if (eventSource && event_types) {
            eventSource.on(event_types.CHAT_CHANGED, () => {
                initializeChatCampaign(context);
            });
        }
        
        console.log("[STRES] Extension loaded successfully");
    });

})();
