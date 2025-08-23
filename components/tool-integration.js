export class ToolIntegration {
    constructor(client, settings) {
        this.client = client;
        this.settings = settings;
        this.toolDefinitions = null;
        this.originalFetch = window.fetch;
        this.init();
    }

    async init() {
        await this.loadToolDefinitions();
        this.setupLLMIntegration();
    }

    async loadToolDefinitions() {
        try {
            // Try enhanced tools first, fallback to original tools
            try {
                this.toolDefinitions = await this.client.getToolDefinitions();
                console.log('[STRES] Loaded', this.toolDefinitions.tools.length, 'enhanced RPG tools');
                this.enhancedMode = true;
            } catch (enhancedError) {
                console.warn('[STRES] Enhanced tools not available, falling back to original tools');
                this.toolDefinitions = await this.client.getOriginalToolDefinitions();
                console.log('[STRES] Loaded', this.toolDefinitions.tools.length, 'original RPG tools');
                this.enhancedMode = false;
            }
        } catch (error) {
            console.error('[STRES] Failed to load tool definitions:', error);
        }
    }

    setupLLMIntegration() {
        const context = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : {};
        if (context.eventSource) {
            context.eventSource.on('messageSend', (data) => this.processOutgoingMessage(data));
            context.eventSource.on('messageReceived', (data) => this.processIncomingMessage(data));
        }

        this.injectToolsIntoContext();
    }

    injectToolsIntoContext() {
        if (!this.toolDefinitions) return;

        const self = this;
        window.fetch = async function(url, options) {
            if (!self.settings.autoToolInjection?.enabled) {
                return self.originalFetch.apply(this, arguments);
            }

            if (typeof url === 'string' && options?.body) {
                try {
                    const body = JSON.parse(options.body);
                    
                    if (url.includes('openai') || url.includes('chat/completions')) {
                        self.injectOpenAITools(body);
                        options.body = JSON.stringify(body);
                    } else if (url.includes('anthropic') || url.includes('claude')) {
                        self.injectClaudeTools(body);
                        options.body = JSON.stringify(body);
                    } else if (url.includes('googleapis.com') && url.includes('gemini')) {
                        self.injectGeminiTools(body);
                        options.body = JSON.stringify(body);
                    }
                } catch (e) {
                    // Silently ignore parse errors
                }
            }
            
            return self.originalFetch.apply(this, arguments);
        };
    }

    injectOpenAITools(body) {
        if (!body.messages || !this.shouldInjectTools(body.messages)) return;
        
        body.tools = this.toolDefinitions.tools.map(tool => ({
            type: "function",
            function: {
                name: tool.function.name,
                description: tool.function.description,
                parameters: tool.function.parameters
            }
        }));
        
        body.tool_choice = "auto";
        console.log('[STRES] Injected', this.toolDefinitions.tools.length, 'tools into OpenAI request');
    }

    injectClaudeTools(body) {
        if (!body.messages || !this.shouldInjectTools(body.messages)) return;
        
        body.tools = this.toolDefinitions.tools.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            input_schema: tool.function.parameters
        }));
        
        console.log('[STRES] Injected', this.toolDefinitions.tools.length, 'tools into Claude request');
    }

    injectGeminiTools(body) {
        if (!body.contents || !this.shouldInjectTools(body.contents)) return;
        
        body.tools = [{
            function_declarations: this.toolDefinitions.tools.map(tool => ({
                name: tool.function.name,
                description: tool.function.description,
                parameters: tool.function.parameters
            }))
        }];
        
        console.log('[STRES] Injected', this.toolDefinitions.tools.length, 'tools into Gemini request');
    }

    shouldInjectTools(messages) {
        if (!this.settings.campaignId) return false;
        if (!this.settings.autoToolInjection?.enabled) return false;

        const recentMessages = Array.isArray(messages) ? messages.slice(-3) : 
                              messages.contents ? messages.contents.slice(-3) : [];
        
        const rpgKeywords = [
            'character', 'npc', 'monster', 'tavern', 'shop', 'encounter', 'combat',
            'stats', 'inventory', 'location', 'quest', 'loot', 'treasure', 'roll',
            'damage', 'healing', 'spell', 'weapon', 'armor', 'gold', 'experience'
        ];

        const messageText = recentMessages.map(msg => 
            typeof msg === 'string' ? msg : 
            msg.content || msg.text || JSON.stringify(msg)
        ).join(' ').toLowerCase();

        return rpgKeywords.some(keyword => messageText.includes(keyword));
    }

    async processOutgoingMessage(data) {
        if (this.settings.autoContextInjection?.enabled && this.settings.campaignId) {
            await this.injectGameContext(data);
        }
    }

    async processIncomingMessage(data) {
        await this.handleToolCalls(data);
        await this.updateGameState(data);
    }

    async injectGameContext(data) {
        try {
            const worldInfo = await this.client.request('/tools/execute', {
                method: 'POST',
                body: JSON.stringify({
                    tool_name: 'query_world_state',
                    parameters: {
                        campaign_id: this.settings.campaignId,
                        query_type: 'all'
                    }
                })
            });

            if (worldInfo.success) {
                const contextInfo = this.formatWorldContext(worldInfo.result);
                data.message = `${contextInfo}\n\n${data.message}`;
            }
        } catch (error) {
            console.error('[STRES] Failed to inject game context:', error);
        }
    }

    formatWorldContext(worldState) {
        const { results } = worldState;
        if (!results || results.length === 0) return '';

        const npcs = results.filter(r => r.type === 'npc').slice(0, 3);
        const locations = results.filter(r => r.type === 'location').slice(0, 3);

        let context = '[Game Context]';
        
        if (npcs.length > 0) {
            context += `\nKnown NPCs: ${npcs.map(npc => npc.name).join(', ')}`;
        }
        
        if (locations.length > 0) {
            context += `\nKnown Locations: ${locations.map(loc => loc.name).join(', ')}`;
        }

        return context;
    }

    async handleToolCalls(data) {
        const toolCalls = this.extractToolCalls(data);
        
        for (const toolCall of toolCalls) {
            try {
                console.log('[STRES] Executing tool:', toolCall.name, toolCall.parameters);
                
                const result = await this.client.executeTool(toolCall.name, toolCall.parameters);
                
                if (result.success) {
                    this.showToolNotification(toolCall.name, result.result);
                    await this.updateUI(toolCall.name, result.result);
                } else {
                    console.error('[STRES] Tool execution failed:', result.error);
                }
            } catch (error) {
                console.error('[STRES] Tool call error:', error);
            }
        }
    }

    extractToolCalls(data) {
        const toolCalls = [];
        
        try {
            if (data.tool_calls) {
                for (const call of data.tool_calls) {
                    toolCalls.push({
                        name: call.function.name,
                        parameters: JSON.parse(call.function.arguments)
                    });
                }
            } else if (data.function_call) {
                toolCalls.push({
                    name: data.function_call.name,
                    parameters: JSON.parse(data.function_call.arguments)
                });
            } else if (data.content && Array.isArray(data.content)) {
                for (const content of data.content) {
                    if (content.type === 'tool_use') {
                        toolCalls.push({
                            name: content.name,
                            parameters: content.input
                        });
                    }
                }
            } else if (data.parts) {
                for (const part of data.parts) {
                    if (part.functionCall) {
                        toolCalls.push({
                            name: part.functionCall.name,
                            parameters: part.functionCall.args
                        });
                    }
                }
            }
        } catch (error) {
            console.error('[STRES] Failed to extract tool calls:', error);
        }
        
        return toolCalls;
    }

    showToolNotification(toolName, result) {
        const notifications = {
            // Enhanced tools
            create_character: `Created Character: ${result.character?.name || 'Unknown'} (Level ${result.character?.level || 1})`,
            learn_skill: `Learned Skill: ${result.skill?.skill_name || 'Unknown'} (${result.skill?.rank || 'Novice'})`,
            cast_spell: `Cast Spell: ${result.spell_name || 'Unknown'} ${result.damage ? `(${result.damage} damage)` : ''}`,
            awaken_unique_skill: `🌟 Unique Skill Awakened: ${result.unique_skill?.name || 'Unknown'}`,
            evolve_unique_skill: `🌟 Unique Skill Evolved: ${result.unique_skill?.name || 'Unknown'} → Stage ${result.unique_skill?.evolution_level || 0}`,
            generate_faction: `Created Faction: ${result.faction?.name || 'Unknown'}`,
            generate_enhanced_location: `Created Location: ${result.location?.name || 'Unknown'} (Pop: ${result.location?.population || 0})`,
            search_lorebook: `Found ${result.entries?.length || 0} lorebook entries`,
            
            // Original tools
            generate_npc: `Created NPC: ${result.npc?.name || 'Unknown'}`,
            generate_monster: `Generated Monster: ${result.monster?.name || 'Unknown'}`,
            generate_location: `Created Location: ${result.location?.name || 'Unknown'}`,
            update_character_stats: `Updated ${result.character || 'Character'}: ${result.changes?.join(', ') || 'Stats changed'}`,
            generate_loot: `Generated ${result.total_items || 0} loot items`,
            roll_dice: `Rolled ${result.expression}: ${result.total} ${result.success_check !== undefined ? (result.success_check ? '(Success)' : '(Failure)') : ''}`
        };

        let message = notifications[toolName] || `Executed ${toolName}`;
        
        // Add special formatting for enhanced features
        if (this.enhancedMode) {
            if (toolName === 'create_character' && result.character?.is_otherworlder) {
                message += ' 🌟 (Otherworlder)';
            }
            if (toolName === 'learn_skill' && result.skill?.techniques?.length > 0) {
                message += ` - ${result.skill.techniques.length} technique${result.skill.techniques.length > 1 ? 's' : ''} unlocked`;
            }
        }
        
        this.createToast(message, 'rpg-tool');
    }

    createToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `stres-toast stres-toast-${type}`;
        toast.innerHTML = `
            <div class="stres-toast-content">
                <span class="stres-toast-icon">🎲</span>
                <span class="stres-toast-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('stres-toast-fade');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    async updateUI(toolName, result) {
        switch (toolName) {
            case 'generate_npc':
                this.updateNPCList(result.npc);
                break;
            case 'generate_location':
                this.updateLocationList(result.location);
                break;
            case 'update_character_stats':
                this.updateCharacterPanel(result);
                break;
            case 'generate_monster':
                this.updateMonsterList(result.monster);
                break;
        }
    }

    updateCharacterPanel(result) {
        const event = new CustomEvent('stresCharacterUpdate', {
            detail: result
        });
        document.dispatchEvent(event);
    }

    updateNPCList(npc) {
        console.log('[STRES] New NPC available:', npc.name);
    }

    updateLocationList(location) {
        console.log('[STRES] New location available:', location.name);
    }

    updateMonsterList(monster) {
        console.log('[STRES] New monster generated:', monster.name);
    }

    async updateGameState(data) {
        if (!this.settings.autoStateTracking?.enabled) return;

        const patterns = [
            {
                pattern: /(?:take|lose|deal)s?\s+(\d+)\s+(?:hp|health|damage)/i,
                action: async (match) => {
                    const amount = parseInt(match[1]);
                    const isHealing = /heal|restore|gain/.test(match[0]);
                    
                    await this.client.executeTool('update_character_stats', {
                        campaign_id: this.settings.campaignId,
                        stat_changes: {
                            hp_change: isHealing ? amount : -amount
                        },
                        reason: 'Story event detected'
                    });
                }
            },
            {
                pattern: /(?:arrives?\s+at|enters?\s+|goes?\s+to)\s+(?:the\s+)?([A-Z][a-z\s]+)/i,
                action: async (match) => {
                    const location = match[1].trim();
                    
                    await this.client.executeTool('update_character_stats', {
                        campaign_id: this.settings.campaignId,
                        stat_changes: {
                            location: location
                        },
                        reason: 'Location change detected'
                    });
                }
            },
            {
                pattern: /(?:finds?|discovers?|loots?)\s+([^.!?]+)/i,
                action: async (match) => {
                    const item = match[1].trim();
                    
                    await this.client.executeTool('update_character_stats', {
                        campaign_id: this.settings.campaignId,
                        stat_changes: {
                            add_items: [item]
                        },
                        reason: 'Item found in story'
                    });
                }
            }
        ];

        const messageText = typeof data === 'string' ? data : 
                           data.message || data.content || JSON.stringify(data);

        for (const { pattern, action } of patterns) {
            const match = messageText.match(pattern);
            if (match) {
                try {
                    await action(match);
                } catch (error) {
                    console.error('[STRES] Auto-update failed:', error);
                }
            }
        }
    }
}

const toastCSS = `
.stres-toast {
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(30, 30, 40, 0.95);
    border: 1px solid rgba(255, 215, 0, 0.5);
    border-radius: 8px;
    padding: 12px 16px;
    color: #e0e0e0;
    font-family: 'Segoe UI', sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    max-width: 300px;
    animation: stresSlideIn 0.3s ease-out;
}

.stres-toast-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.stres-toast-icon {
    font-size: 16px;
}

.stres-toast-rpg-tool {
    border-color: rgba(255, 215, 0, 0.7);
    background: rgba(255, 215, 0, 0.1);
}

.stres-toast-fade {
    animation: stresFadeOut 0.3s ease-in forwards;
}

@keyframes stresSlideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes stresFadeOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`;

if (typeof document !== 'undefined' && !document.getElementById('stres-toast-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'stres-toast-styles';
    styleElement.textContent = toastCSS;
    document.head.appendChild(styleElement);
}