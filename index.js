(function() {
    'use strict';
    
    const extensionName = "stres";
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
    
    const defaultSettings = {
        serverUrl: "http://localhost:8000",
        campaignId: null,
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
        extension_settings[extensionName] = extension_settings[extensionName] || {};
        
        if (Object.keys(extension_settings[extensionName]).length === 0) {
            Object.assign(extension_settings[extensionName], defaultSettings);
        }
        
        saveExtensionSettings();
    }

    async function onExtensionLoad() {
        await loadSettings();
        
        stresClient = new STRESClient(extension_settings[extensionName].serverUrl);
        characterPanel = new CharacterPanel(stresClient, extension_settings[extensionName]);
        autoInjector = new AutoInjector(stresClient, extension_settings[extensionName]);
        
        registerSlashCommands();
        setupUI();
        
        if (extension_settings[extensionName].campaignId) {
            await loadCampaign(extension_settings[extensionName].campaignId);
        }
        
        console.log("[STRES] Extension loaded successfully");
    }

    function registerSlashCommands() {
        registerSlashCommand('stats', showCharacterStats, [], "Show character stats", true, true);
        registerSlashCommand('inventory', showInventory, [], "Show character inventory", true, true);
        registerSlashCommand('world', showWorldInfo, [], "Show world information", true, true);
        registerSlashCommand('stres_campaign', manageCampaign, ['action'], "Manage STRES campaign", true, true);
        registerSlashCommand('stres_npc', generateNPC, ['culture', 'role'], "Generate NPC", true, true);
        registerSlashCommand('stres_monster', generateMonster, ['type', 'level'], "Generate monster", true, true);
        registerSlashCommand('stres_location', generateLocation, ['type'], "Generate location", true, true);
        registerSlashCommand('stres_roll', rollDice, ['dice'], "Roll dice", true, true);
        registerSlashCommand('stres_settings', showSettings, [], "STRES settings", true, true);
    }

    async function showCharacterStats(args) {
        if (!extension_settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        try {
            const characters = await stresClient.getCharacters(extension_settings[extensionName].campaignId);
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
                return `Error: Cannot connect to STRES server at ${extension_settings[extensionName].serverUrl}. Is it running?`;
            }
        }
        
        const action = args[0];
        const name = args.slice(1).join(' ');
        
        try {
            switch(action) {
                case 'create':
                    if (!name) return "Please provide a campaign name";
                    const newCampaign = await stresClient.createCampaign({ name, description: "" });
                    extension_settings[extensionName].campaignId = newCampaign.id;
                    saveExtensionSettings();
                    await loadCampaign(newCampaign.id);
                    return `Campaign '${name}' created and loaded`;
                    
                case 'load':
                    if (!name) return "Please provide a campaign ID";
                    await loadCampaign(name);
                    extension_settings[extensionName].campaignId = name;
                    saveExtensionSettings();
                    return `Campaign loaded`;
                    
                case 'delete':
                    if (!name) return "Please provide a campaign ID";
                    await stresClient.deleteCampaign(name);
                    if (extension_settings[extensionName].campaignId === name) {
                        extension_settings[extensionName].campaignId = null;
                        saveExtensionSettings();
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
        
        if (!extension_settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        const [culture, role, gender, level] = args;
        try {
            const result = await stresClient.generateNPC(
                extension_settings[extensionName].campaignId,
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
        
        if (!extension_settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        const [type, level, size, isBoss] = args;
        try {
            const result = await stresClient.generateMonster(
                extension_settings[extensionName].campaignId,
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
        
        if (!extension_settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        const [type, size, wealth] = args;
        try {
            const result = await stresClient.generateLocation(
                extension_settings[extensionName].campaignId,
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

    async function showSettings(args) {
        const html = `
            <div class="stres-settings">
                <h3>STRES Settings</h3>
                <div>
                    <label>Server URL: <input type="text" id="stres-server-url" value="${extension_settings[extensionName].serverUrl}"></label>
                </div>
                <div>
                    <label>Auto-injection: <input type="checkbox" id="stres-auto-inject" ${extension_settings[extensionName].autoInjection.enabled ? 'checked' : ''}></label>
                </div>
                <div>
                    <label>Theme: 
                        <select id="stres-theme">
                            <option value="fantasy" ${extension_settings[extensionName].ui.theme === 'fantasy' ? 'selected' : ''}>Fantasy</option>
                            <option value="cyberpunk" ${extension_settings[extensionName].ui.theme === 'cyberpunk' ? 'selected' : ''}>Cyberpunk</option>
                            <option value="minimal" ${extension_settings[extensionName].ui.theme === 'minimal' ? 'selected' : ''}>Minimal</option>
                        </select>
                    </label>
                </div>
                <button onclick="saveSTRESSettings()">Save Settings</button>
            </div>
        `;
        return html;
    }

    function setupUI() {
        const container = document.createElement('div');
        container.id = 'stres-container';
        container.className = `stres-theme-${extension_settings[extensionName].ui.theme}`;
        document.body.appendChild(container);
        
        if (extension_settings[extensionName].ui.showHUD) {
            characterPanel.render(container);
        }
        
        window.saveSTRESSettings = function() {
            extension_settings[extensionName].serverUrl = document.getElementById('stres-server-url').value;
            extension_settings[extensionName].autoInjection.enabled = document.getElementById('stres-auto-inject').checked;
            extension_settings[extensionName].ui.theme = document.getElementById('stres-theme').value;
            saveExtensionSettings();
            location.reload();
        };
    }

    async function loadCampaign(campaignId) {
        try {
            const campaign = await stresClient.getCampaign(campaignId);
            const characters = await stresClient.getCharacters(campaignId);
            
            if (characters.length > 0) {
                const playerChar = characters.find(c => c.is_player) || characters[0];
                characterPanel.setCharacter(playerChar);
                autoInjector.setCharacter(playerChar);
            }
            
            console.log(`[STRES] Campaign '${campaign.name}' loaded`);
        } catch (error) {
            console.error("[STRES] Failed to load campaign:", error);
        }
    }

    // Initialize extension when SillyTavern loads
    jQuery(async () => {
        // Wait for SillyTavern to be ready
        if (typeof getContext === 'undefined') {
            console.error("[STRES] SillyTavern context not available");
            return;
        }
        
        const context = getContext();
        if (context.eventSource) {
            context.eventSource.on('chatLoaded', onExtensionLoad);
            context.eventSource.on('messageSend', (data) => {
                if (extension_settings[extensionName]?.autoInjection?.enabled && autoInjector) {
                    autoInjector.injectContext(data);
                }
            });
        }
    });

})();