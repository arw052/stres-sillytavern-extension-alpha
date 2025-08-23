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
        characterCards: {
            autoImport: true,
            supportedFormats: ["v2", "tavern", "stres", "json"],
            includeWorldInfo: true,
            includeLorebook: true
        },
        ruleset: {
            type: "isekai",
            customSettings: {}
        },
        lorebook: {
            autoActivation: true,
            showSecrets: false,
            contextPriority: 7
        },
        worldBuilding: {
            enabledFeatures: ["factions", "locations", "npcs", "demographics"]
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
    let lorebookManager;
    let characterCardManager;
    let worldMapViewer;

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

        // Tool calling methods - Enhanced
        async getToolDefinitions() {
            return this.request('/enhanced/tools/definitions');
        }
        
        async getOriginalToolDefinitions() {
            return this.request('/tools/definitions');
        }

        async executeTool(toolName, parameters) {
            return this.request('/enhanced/tools/execute', {
                method: 'POST',
                body: JSON.stringify({
                    tool_name: toolName,
                    parameters: parameters
                })
            });
        }
        
        async executeOriginalTool(toolName, parameters) {
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
        
        // Enhanced API methods
        async importCharacterCard(cardData, campaignId, formatType = 'auto') {
            return this.request('/enhanced/character/import', {
                method: 'POST',
                body: JSON.stringify({
                    card_data: cardData,
                    campaign_id: campaignId,
                    format_type: formatType
                })
            });
        }
        
        async exportCharacterCard(characterId, options = {}) {
            const params = new URLSearchParams();
            if (options.format_type) params.append('format_type', options.format_type);
            if (options.include_world) params.append('include_world', options.include_world);
            if (options.include_lorebook) params.append('include_lorebook', options.include_lorebook);
            
            return this.request(`/enhanced/character/${characterId}/export?${params.toString()}`);
        }
        
        async searchLorebook(campaignId, keywords, options = {}) {
            return this.request(`/enhanced/lorebook/${campaignId}/search`, {
                method: 'POST',
                body: JSON.stringify({
                    keywords: keywords,
                    location: options.location,
                    include_secrets: options.include_secrets || false
                })
            });
        }
        
        async getSkillCategories() {
            return this.request('/enhanced/skills/categories');
        }
        
        async getMagicSchools() {
            return this.request('/enhanced/magic/schools');
        }
        
        async getAvailableRulesets() {
            return this.request('/enhanced/rulesets');
        }
        
        async getRulesetDetails(rulesetName) {
            return this.request(`/enhanced/rulesets/${rulesetName}`);
        }
        
        async getWorldMap(campaignId) {
            return this.request(`/enhanced/world/${campaignId}/map`);
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
        const settings = window.extension_settings || extension_settings;
        if (!settings[extensionName]?.campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        try {
            const worldState = await stresClient.executeTool('query_world_state', {
                campaign_id: settings[extensionName].campaignId,
                query_type: 'all'
            });
            
            if (worldState.success && worldState.result.results) {
                const results = worldState.result.results;
                const locations = results.filter(r => r.type === 'location').slice(0, 5);
                const npcs = results.filter(r => r.type === 'npc').slice(0, 5);
                
                let response = "## 🗺️ World Information\n────────────────────────\n";
                
                if (locations.length > 0) {
                    response += "**Known Locations:**\n";
                    locations.forEach(loc => {
                        response += `• ${loc.name} (${loc.type})\n`;
                    });
                    response += "\n";
                }
                
                if (npcs.length > 0) {
                    response += "**Known NPCs:**\n";
                    npcs.forEach(npc => {
                        response += `• ${npc.name} - ${npc.culture} ${npc.role}\n`;
                    });
                }
                
                return response || "No world information discovered yet.";
            } else {
                return "No world information available.";
            }
        } catch (error) {
            return `Error retrieving world info: ${error.message}`;
        }
    }

    async function createEnhancedCharacter(args) {
        if (args.length < 3) {
            return "Usage: /stres_create_character <name> <race> <class> [level]\\nExample: /stres_create_character \"Akira\" otherworlder mage 1";
        }
        
        const settings = window.extension_settings || extension_settings;
        if (!settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        const [name, race, characterClass, level] = args;
        try {
            const result = await stresClient.executeTool('create_character', {
                campaign_id: settings[extensionName].campaignId,
                name: name.replace(/['"]/g, ''), // Remove quotes
                race: race,
                character_class: characterClass,
                level: parseInt(level) || 1,
                is_otherworlder: race === 'otherworlder'
            });
            
            if (result.success) {
                const character = result.result.character;
                // Update character panel if available
                if (characterPanel && characterPanel.updateCharacterData) {
                    await characterPanel.updateCharacterData(character);
                }
                
                return `**${character.name}** created successfully!
                ────────────────────────
                **Race:** ${character.race} | **Class:** ${character.class} | **Level:** ${character.level}
                **Stats:** STR ${character.stats.STR} | DEX ${character.stats.DEX} | CON ${character.stats.CON} | INT ${character.stats.INT} | WIS ${character.stats.WIS} | CHA ${character.stats.CHA} | LCK ${character.stats.LCK}
                **HP:** ${character.hp} | **MP:** ${character.mp}
                ${character.is_otherworlder ? '🌟 **Otherworlder abilities activated!**' : ''}`;
            } else {
                return `Failed to create character: ${result.error || 'Unknown error'}`;
            }
        } catch (error) {
            return `Error creating character: ${error.message}`;
        }
    }

    async function learnSkill(args) {
        if (args.length < 1) {
            return "Usage: /stres_learn_skill <skill_name> [category]\\nExample: /stres_learn_skill \"Swordsmanship\" combat";
        }
        
        const settings = window.extension_settings || extension_settings;
        if (!settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        const skillName = args[0].replace(/['"]/g, '');
        const category = args[1] || 'general';
        
        try {
            const result = await stresClient.executeTool('learn_skill', {
                campaign_id: settings[extensionName].campaignId,
                skill_name: skillName,
                skill_category: category
            });
            
            if (result.success) {
                const skill = result.result.skill;
                return `📚 **Skill Learned!**
                ────────────────────────
                **${skill.skill_name}** (${skill.category})
                **Rank:** ${skill.rank} | **XP:** ${skill.experience}/${skill.next_threshold}
                ${skill.techniques && skill.techniques.length > 0 ? `**Techniques:** ${skill.techniques.join(', ')}` : ''}`;
            } else {
                return `Failed to learn skill: ${result.error || 'Unknown error'}`;
            }
        } catch (error) {
            return `Error learning skill: ${error.message}`;
        }
    }

    async function castSpell(args) {
        if (args.length < 1) {
            return "Usage: /stres_cast_spell <spell_name> [target]\\nExample: /stres_cast_spell \"Fireball\" goblin";
        }
        
        const settings = window.extension_settings || extension_settings;
        if (!settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        const spellName = args[0].replace(/['"]/g, '');
        const target = args.slice(1).join(' ') || 'enemy';
        
        try {
            const result = await stresClient.executeTool('cast_spell', {
                campaign_id: settings[extensionName].campaignId,
                spell_name: spellName,
                target: target
            });
            
            if (result.success) {
                const spellResult = result.result;
                return `✨ **${spellName} Cast!**
                ────────────────────────
                **Target:** ${target}
                **MP Cost:** ${spellResult.mp_cost} | **School:** ${spellResult.school}
                ${spellResult.damage ? `**Damage:** ${spellResult.damage}` : ''}
                ${spellResult.effect ? `**Effect:** ${spellResult.effect}` : ''}`;
            } else {
                return `Failed to cast spell: ${result.error || 'Unknown error'}`;
            }
        } catch (error) {
            return `Error casting spell: ${error.message}`;
        }
    }

    async function importCharacterCard(args) {
        try {
            // Create file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';
            document.body.appendChild(input);
            
            return new Promise((resolve) => {
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) {
                        document.body.removeChild(input);
                        resolve("No file selected.");
                        return;
                    }
                    
                    try {
                        const text = await file.text();
                        const cardData = JSON.parse(text);
                        
                        const settings = window.extension_settings || extension_settings;
                        const result = await stresClient.importCharacterCard(
                            cardData,
                            settings[extensionName].campaignId,
                            'auto'
                        );
                        
                        if (result.success) {
                            document.body.removeChild(input);
                            resolve(`✅ **Character Card Imported!**
                            ────────────────────────────────
                            **Character:** ${result.character_name}
                            **Format:** ${result.format}
                            **Imported Data:** ${result.imported_data.skills || 0} skills, ${result.imported_data.spells || 0} spells, ${result.imported_data.lorebook_entries || 0} lore entries`);
                        } else {
                            document.body.removeChild(input);
                            resolve(`Failed to import character card: ${result.error || 'Unknown error'}`);
                        }
                    } catch (error) {
                        document.body.removeChild(input);
                        resolve(`Error importing character card: ${error.message}`);
                    }
                };
                
                input.click();
                
                // Fallback message
                setTimeout(() => {
                    resolve("Click to select a character card file (.json) to import...");
                }, 100);
            });
        } catch (error) {
            return `Error setting up import: ${error.message}`;
        }
    }

    async function exportCharacterCard(args) {
        const settings = window.extension_settings || extension_settings;
        if (!settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        try {
            const characters = await stresClient.getCharacters(settings[extensionName].campaignId);
            const playerChar = characters.find(c => c.is_player);
            
            if (!playerChar) {
                return "No player character found to export.";
            }
            
            const result = await stresClient.exportCharacterCard(playerChar.id, {
                format_type: 'v2',
                include_world: true,
                include_lorebook: true
            });
            
            if (result.success) {
                // Create download
                const dataStr = JSON.stringify(result.card, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(dataBlob);
                link.download = `${playerChar.name}_stres_v2.json`;
                link.click();
                
                return `💾 **Character Card Exported!**
                ────────────────────────────────
                **Character:** ${playerChar.name}
                **Format:** Character Card v2
                **Includes:** World info, Lorebook entries, Progression data
                **File:** ${playerChar.name}_stres_v2.json`;
            } else {
                return `Failed to export character card: ${result.error || 'Unknown error'}`;
            }
        } catch (error) {
            return `Error exporting character card: ${error.message}`;
        }
    }

    async function searchLorebook(args) {
        if (args.length < 1) {
            return "Usage: /stres_lorebook <keywords>\\nExample: /stres_lorebook magic convergence";
        }
        
        const settings = window.extension_settings || extension_settings;
        if (!settings[extensionName].campaignId) {
            return "No campaign loaded. Use /stres_campaign create <name> first.";
        }
        
        const keywords = args;
        
        try {
            const result = await stresClient.searchLorebook(
                settings[extensionName].campaignId,
                keywords,
                { include_secrets: false }
            );
            
            if (result.success && result.entries && result.entries.length > 0) {
                let response = `📚 **Lorebook Search Results**
                ────────────────────────────────
                **Keywords:** ${keywords.join(', ')}
                
                `;
                
                result.entries.slice(0, 3).forEach((entry, index) => {
                    response += `**${index + 1}. ${entry.title}**
                    Category: ${entry.category}
                    ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}
                    
                    `;
                });
                
                if (result.entries.length > 3) {
                    response += `*... and ${result.entries.length - 3} more entries found*`;
                }
                
                return response;
            } else {
                return `No lorebook entries found for keywords: ${keywords.join(', ')}`;
            }
        } catch (error) {
            return `Error searching lorebook: ${error.message}`;
        }
    }

    async function initializeEnhancedManagers() {
        // Initialize lorebook manager
        lorebookManager = {
            async search(keywords, options = {}) {
                return await stresClient.searchLorebook(
                    stresClient.settings.campaignId,
                    keywords,
                    options
                );
            }
        };
        
        // Initialize character card manager
        characterCardManager = {
            async import(cardData, formatType = 'auto') {
                return await stresClient.importCharacterCard(
                    cardData,
                    stresClient.settings.campaignId,
                    formatType
                );
            },
            async export(characterId, options = {}) {
                return await stresClient.exportCharacterCard(characterId, options);
            }
        };
        
        console.log("[STRES] Enhanced managers initialized");
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
                // VERSION 2.1 - Fixed health endpoint
                const healthUrl = `${settings[extensionName].serverUrl}/health`;
                console.log("[STRES] Checking server health at:", healthUrl);
                const healthResponse = await fetch(healthUrl);
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
        
        // Load available rulesets
        let rulesetOptions = '';
        try {
            const rulesets = await stresClient.getAvailableRulesets();
            if (rulesets.rulesets) {
                rulesets.rulesets.forEach(ruleset => {
                    const selected = settings[extensionName].ruleset?.type === ruleset ? 'selected' : '';
                    rulesetOptions += `<option value="${ruleset}" ${selected}>${ruleset.charAt(0).toUpperCase() + ruleset.slice(1)}</option>`;
                });
            }
        } catch (error) {
            console.error('[STRES] Failed to load rulesets:', error);
            rulesetOptions = '<option value="isekai">Isekai (Default)</option>';
        }

        const html = `
            <div class="stres-settings">
                <h3>🎭 STRES v2.0 Enhanced Settings</h3>
                
                <div class="settings-section">
                    <h4>🔧 Server Configuration</h4>
                    <div class="setting-item">
                        <label>Server URL:</label>
                        <input type="text" id="stres-server-url" value="${settings[extensionName].serverUrl}" placeholder="http://localhost:8000">
                        <small>STRES backend server address</small>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>🤖 LLM Tool Integration</h4>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="stres-tool-injection" ${settings[extensionName].autoToolInjection?.enabled ? 'checked' : ''}>
                            Enable automatic tool injection
                        </label>
                        <small>Automatically inject RPG tools into LLM API calls</small>
                    </div>
                    <div class="setting-item">
                        <label>Supported Models:</label>
                        <div class="model-checkboxes">
                            <label><input type="checkbox" class="stres-model-check" value="gpt-4" ${settings[extensionName].autoToolInjection?.enabledModels?.includes('gpt-4') ? 'checked' : ''}> GPT-4/GPT-4 Turbo</label>
                            <label><input type="checkbox" class="stres-model-check" value="gpt-5" ${settings[extensionName].autoToolInjection?.enabledModels?.includes('gpt-5') ? 'checked' : ''}> GPT-5</label>
                            <label><input type="checkbox" class="stres-model-check" value="claude" ${settings[extensionName].autoToolInjection?.enabledModels?.includes('claude') ? 'checked' : ''}> Claude 3/3.5 Sonnet</label>
                            <label><input type="checkbox" class="stres-model-check" value="gemini-2.5-pro" ${settings[extensionName].autoToolInjection?.enabledModels?.includes('gemini-2.5-pro') ? 'checked' : ''}> Gemini 2.5 Pro</label>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>📋 Character Cards & Import/Export</h4>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="stres-auto-import" ${settings[extensionName].characterCards?.autoImport ? 'checked' : ''}>
                            Auto-import character cards
                        </label>
                        <small>Automatically detect and import character card data</small>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="stres-include-world" ${settings[extensionName].characterCards?.includeWorldInfo !== false ? 'checked' : ''}>
                            Include world info in exports
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="stres-include-lorebook" ${settings[extensionName].characterCards?.includeLorebook !== false ? 'checked' : ''}>
                            Include lorebook in exports
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>⚙️ RPG System Configuration</h4>
                    <div class="setting-item">
                        <label>Ruleset:</label>
                        <select id="stres-ruleset">
                            ${rulesetOptions}
                        </select>
                        <small>Choose your preferred RPG system (Isekai, D&D 5e, Generic, etc.)</small>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>📚 Lorebook Integration</h4>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="stres-lorebook-auto" ${settings[extensionName].lorebook?.autoActivation !== false ? 'checked' : ''}>
                            Auto-activate lorebook entries
                        </label>
                        <small>Automatically surface relevant lore based on context</small>
                    </div>
                    <div class="setting-item">
                        <label>Context Priority (1-10):</label>
                        <input type="range" id="stres-lorebook-priority" min="1" max="10" value="${settings[extensionName].lorebook?.contextPriority || 7}">
                        <span id="priority-value">${settings[extensionName].lorebook?.contextPriority || 7}</span>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>📊 Auto State Tracking</h4>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="stres-state-tracking" ${settings[extensionName].autoStateTracking?.enabled ? 'checked' : ''}>
                            Enable automatic state tracking
                        </label>
                        <small>Detect HP/MP changes, location updates, and inventory from story</small>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="stres-track-location" ${settings[extensionName].autoStateTracking?.trackLocation !== false ? 'checked' : ''}>
                            Track location changes
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="stres-track-health" ${settings[extensionName].autoStateTracking?.trackHealth !== false ? 'checked' : ''}>
                            Track health/damage
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="stres-track-inventory" ${settings[extensionName].autoStateTracking?.trackInventory !== false ? 'checked' : ''}>
                            Track inventory changes
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>🎨 UI & Experience</h4>
                    <div class="setting-item">
                        <label>Theme:</label>
                        <select id="stres-theme">
                            <option value="fantasy" ${settings[extensionName].ui?.theme === 'fantasy' ? 'selected' : ''}>Fantasy</option>
                            <option value="cyberpunk" ${settings[extensionName].ui?.theme === 'cyberpunk' ? 'selected' : ''}>Cyberpunk</option>
                            <option value="minimal" ${settings[extensionName].ui?.theme === 'minimal' ? 'selected' : ''}>Minimal</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="stres-show-hud" ${settings[extensionName].ui?.showHUD !== false ? 'checked' : ''}>
                            Show character HUD
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="stres-auto-inject-context" ${settings[extensionName].autoInjection?.enabled ? 'checked' : ''}>
                            Auto-inject character status
                        </label>
                        <small>Add character status to messages automatically</small>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>🌍 World Building Features</h4>
                    <div class="setting-item">
                        <label>Enable World Features:</label>
                        <div class="world-features">
                            <label><input type="checkbox" class="stres-world-feature" value="factions" ${settings[extensionName].worldBuilding?.enabledFeatures?.includes('factions') ? 'checked' : 'checked'}> Factions</label>
                            <label><input type="checkbox" class="stres-world-feature" value="locations" ${settings[extensionName].worldBuilding?.enabledFeatures?.includes('locations') ? 'checked' : 'checked'}> Locations</label>
                            <label><input type="checkbox" class="stres-world-feature" value="npcs" ${settings[extensionName].worldBuilding?.enabledFeatures?.includes('npcs') ? 'checked' : 'checked'}> NPCs</label>
                            <label><input type="checkbox" class="stres-world-feature" value="demographics" ${settings[extensionName].worldBuilding?.enabledFeatures?.includes('demographics') ? 'checked' : 'checked'}> Demographics</label>
                        </div>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button onclick="saveSTRESSettings()" class="save-btn">💾 Save Settings</button>
                    <button onclick="resetSTRESSettings()" class="reset-btn">🔄 Reset to Defaults</button>
                    <button onclick="exportSTRESSettings()" class="export-btn">📤 Export Config</button>
                </div>

                <div class="settings-info">
                    <h4>ℹ️ Available Commands</h4>
                    <div class="commands-list">
                        <code>/stres_create_character &lt;name&gt; &lt;race&gt; &lt;class&gt;</code> - Create enhanced character<br>
                        <code>/stres_learn_skill &lt;skill_name&gt;</code> - Learn a new skill<br>
                        <code>/stres_cast_spell &lt;spell_name&gt;</code> - Cast a spell<br>
                        <code>/stres_import_card</code> - Import character card<br>
                        <code>/stres_export_card</code> - Export character card<br>
                        <code>/stres_lorebook &lt;keywords&gt;</code> - Search lorebook<br>
                        <code>/stres_status</code> - Show system status
                    </div>
                </div>
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
            
            // Server configuration
            currentSettings[extensionName].serverUrl = document.getElementById('stres-server-url').value;
            
            // LLM Tool Integration
            currentSettings[extensionName].autoToolInjection = currentSettings[extensionName].autoToolInjection || {};
            currentSettings[extensionName].autoToolInjection.enabled = document.getElementById('stres-tool-injection').checked;
            
            // Collect enabled models
            const modelCheckboxes = document.querySelectorAll('.stres-model-check');
            const enabledModels = [];
            modelCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    enabledModels.push(checkbox.value);
                }
            });
            currentSettings[extensionName].autoToolInjection.enabledModels = enabledModels;
            
            // Character Cards
            currentSettings[extensionName].characterCards = currentSettings[extensionName].characterCards || {};
            const autoImportEl = document.getElementById('stres-auto-import');
            if (autoImportEl) currentSettings[extensionName].characterCards.autoImport = autoImportEl.checked;
            const includeWorldEl = document.getElementById('stres-include-world');
            if (includeWorldEl) currentSettings[extensionName].characterCards.includeWorldInfo = includeWorldEl.checked;
            const includeLoreEl = document.getElementById('stres-include-lorebook');
            if (includeLoreEl) currentSettings[extensionName].characterCards.includeLorebook = includeLoreEl.checked;
            
            // Ruleset
            const rulesetEl = document.getElementById('stres-ruleset');
            if (rulesetEl) {
                currentSettings[extensionName].ruleset = currentSettings[extensionName].ruleset || {};
                currentSettings[extensionName].ruleset.type = rulesetEl.value;
            }
            
            // Lorebook
            currentSettings[extensionName].lorebook = currentSettings[extensionName].lorebook || {};
            const lorebookAutoEl = document.getElementById('stres-lorebook-auto');
            if (lorebookAutoEl) currentSettings[extensionName].lorebook.autoActivation = lorebookAutoEl.checked;
            const priorityEl = document.getElementById('stres-lorebook-priority');
            if (priorityEl) currentSettings[extensionName].lorebook.contextPriority = parseInt(priorityEl.value);
            
            // State tracking
            currentSettings[extensionName].autoStateTracking = currentSettings[extensionName].autoStateTracking || {};
            const stateTrackingEl = document.getElementById('stres-state-tracking');
            if (stateTrackingEl) currentSettings[extensionName].autoStateTracking.enabled = stateTrackingEl.checked;
            const trackLocationEl = document.getElementById('stres-track-location');
            if (trackLocationEl) currentSettings[extensionName].autoStateTracking.trackLocation = trackLocationEl.checked;
            const trackHealthEl = document.getElementById('stres-track-health');
            if (trackHealthEl) currentSettings[extensionName].autoStateTracking.trackHealth = trackHealthEl.checked;
            const trackInventoryEl = document.getElementById('stres-track-inventory');
            if (trackInventoryEl) currentSettings[extensionName].autoStateTracking.trackInventory = trackInventoryEl.checked;
            
            // UI Settings
            currentSettings[extensionName].ui = currentSettings[extensionName].ui || {};
            const themeEl = document.getElementById('stres-theme');
            if (themeEl) currentSettings[extensionName].ui.theme = themeEl.value;
            const showHudEl = document.getElementById('stres-show-hud');
            if (showHudEl) currentSettings[extensionName].ui.showHUD = showHudEl.checked;
            
            // Auto injection
            currentSettings[extensionName].autoInjection = currentSettings[extensionName].autoInjection || {};
            const autoInjectEl = document.getElementById('stres-auto-inject-context');
            if (autoInjectEl) currentSettings[extensionName].autoInjection.enabled = autoInjectEl.checked;
            
            // World Building Features
            currentSettings[extensionName].worldBuilding = currentSettings[extensionName].worldBuilding || {};
            const worldFeatureCheckboxes = document.querySelectorAll('.stres-world-feature');
            const enabledFeatures = [];
            worldFeatureCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    enabledFeatures.push(checkbox.value);
                }
            });
            currentSettings[extensionName].worldBuilding.enabledFeatures = enabledFeatures;
            
            // Use SillyTavern's save function
            if (typeof saveSettingsDebounced === 'function') {
                saveSettingsDebounced();
            } else if (typeof saveExtensionSettings === 'function') {
                saveExtensionSettings();
            }
            
            console.log("[STRES] Enhanced settings saved:", currentSettings[extensionName]);
            
            // Update tool integration if it exists
            if (toolIntegration) {
                toolIntegration.settings = currentSettings[extensionName];
                toolIntegration.init();
            }
            
            // Show success notification
            const toast = document.createElement('div');
            toast.className = 'stres-toast toast-success';
            toast.innerHTML = '✅ STRES settings saved successfully!';
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        };
        
        // Add additional setting functions
        window.resetSTRESSettings = function() {
            if (confirm('Reset all STRES settings to defaults? This cannot be undone.')) {
                const currentSettings = window.extension_settings || extension_settings;
                currentSettings[extensionName] = structuredClone(defaultSettings);
                
                if (typeof saveSettingsDebounced === 'function') {
                    saveSettingsDebounced();
                }
                
                location.reload();
            }
        };
        
        window.exportSTRESSettings = function() {
            const currentSettings = window.extension_settings || extension_settings;
            const exportData = {
                version: '2.0',
                settings: currentSettings[extensionName],
                exported_at: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'stres_settings.json';
            link.click();
        };
        
        // Update priority value display
        document.addEventListener('DOMContentLoaded', () => {
            const prioritySlider = document.getElementById('stres-lorebook-priority');
            const priorityValue = document.getElementById('priority-value');
            if (prioritySlider && priorityValue) {
                prioritySlider.addEventListener('input', (e) => {
                    priorityValue.textContent = e.target.value;
                });
            }
        });
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
        
        // Import and initialize enhanced components
        try {
            const { ToolIntegration } = await import('./components/tool-integration.js');
            toolIntegration = new ToolIntegration(stresClient, extensionSettings[extensionName]);
            console.log("[STRES] Tool integration initialized");
            
            // Initialize Enhanced Character Panel
            const { EnhancedCharacterPanel } = await import('./components/enhanced-character-panel.js');
            characterPanel = new EnhancedCharacterPanel(stresClient, extensionSettings[extensionName]);
            console.log("[STRES] Enhanced character panel initialized");
            
            // Initialize lorebook and character card managers
            await initializeEnhancedManagers();
            
        } catch (error) {
            console.error("[STRES] Failed to initialize enhanced components:", error);
            // Fallback to basic character panel
            characterPanel = new CharacterPanel(stresClient, extensionSettings[extensionName]);
        }
        
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
            
            // Enhanced tool commands
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_create_character',
                callback: createEnhancedCharacter,
                helpString: 'Create enhanced character - Usage: /stres_create_character <name> <race> <class> [level]'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_learn_skill',
                callback: learnSkill,
                helpString: 'Learn a skill - Usage: /stres_learn_skill <skill_name> [category]'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_cast_spell',
                callback: castSpell,
                helpString: 'Cast a spell - Usage: /stres_cast_spell <spell_name> [target]'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_import_card',
                callback: importCharacterCard,
                helpString: 'Import character card from file'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_export_card',
                callback: exportCharacterCard,
                helpString: 'Export character card to file'
            }));
            
            SlashCommandParser.addCommandObject(SlashCommand.fromProps({
                name: 'stres_lorebook',
                callback: searchLorebook,
                helpString: 'Search lorebook - Usage: /stres_lorebook <keywords>'
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
            
            // Enhanced commands
            registerSlashCommand('stres_create_character', createEnhancedCharacter, [], 'Create enhanced character', true, true);
            registerSlashCommand('stres_learn_skill', learnSkill, [], 'Learn a skill', true, true);
            registerSlashCommand('stres_cast_spell', castSpell, [], 'Cast a spell', true, true);
            registerSlashCommand('stres_import_card', importCharacterCard, [], 'Import character card', true, true);
            registerSlashCommand('stres_export_card', exportCharacterCard, [], 'Export character card', true, true);
            registerSlashCommand('stres_lorebook', searchLorebook, [], 'Search lorebook', true, true);
            
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
