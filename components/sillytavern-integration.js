/**
 * SillyTavern Integration for STRES Context Switching
 * Handles fallback API switching and context management
 */

export class SillyTavernIntegration {
    constructor(client, settings) {
        this.client = client;
        this.settings = settings;
        this.originalContext = null;
        this.combatActive = false;
        
        // SillyTavern context hooks
        this.ST = null;
        this.originalSendMessage = null;
        this.originalGenerateQuietPrompt = null;
        
        this.init();
    }

    async init() {
        // Wait for SillyTavern to load
        await this.waitForSillyTavern();
        
        // Hook into SillyTavern's systems
        this.setupAPIInterceptor();
        this.setupMessageInterceptor();
        this.setupUIIntegration();
    }

    /**
     * Wait for SillyTavern to be available
     */
    async waitForSillyTavern() {
        return new Promise((resolve) => {
            const checkST = () => {
                if (window.SillyTavern || window.getContext) {
                    this.ST = window.SillyTavern || window;
                    resolve();
                } else {
                    setTimeout(checkST, 100);
                }
            };
            checkST();
        });
    }

    /**
     * Setup API request interceptor for context switching
     */
    setupAPIInterceptor() {
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(url, options) {
            // Intercept chat completion requests
            if (self.isLLMRequest(url) && options?.body) {
                return self.interceptLLMRequest(url, options, originalFetch);
            }
            
            return originalFetch.apply(this, arguments);
        };
    }

    /**
     * Check if request is to an LLM API
     */
    isLLMRequest(url) {
        return url.includes('/chat/completions') ||
               url.includes('/v1/messages') ||
               url.includes('/v1beta/generateContent') ||
               url.includes('openai') ||
               url.includes('anthropic') ||
               url.includes('googleapis');
    }

    /**
     * Intercept and modify LLM requests for combat mode
     */
    async interceptLLMRequest(url, options, originalFetch) {
        try {
            const requestBody = JSON.parse(options.body);
            
            // If in combat mode, switch to combat context
            if (this.combatActive) {
                console.log('[STRES] Switching to combat context');
                
                // Modify request for combat
                const combatRequest = await this.createCombatRequest(requestBody, url);
                
                // Use fallback API if configured
                const combatEndpoint = this.getCombatEndpoint(url);
                
                options.body = JSON.stringify(combatRequest);
                
                // Make request to combat-specific endpoint
                const response = await originalFetch(combatEndpoint, options);
                
                // Process combat response
                return this.processCombatResponse(response);
            }
            
        } catch (error) {
            console.warn('[STRES] Error intercepting request:', error);
        }
        
        // Default behavior
        return originalFetch.apply(this, [url, options]);
    }

    /**
     * Create combat-optimized request
     */
    async createCombatRequest(originalRequest, url) {
        const combatRequest = { ...originalRequest };
        
        // Reduce context for combat
        if (combatRequest.messages) {
            // Keep system message + last 3 messages only
            const systemMsg = combatRequest.messages.find(m => m.role === 'system');
            const recentMessages = combatRequest.messages.slice(-3);
            
            combatRequest.messages = [];
            
            if (systemMsg) {
                // Replace with combat-focused system prompt
                combatRequest.messages.push({
                    role: 'system',
                    content: this.getCombatSystemPrompt()
                });
            }
            
            // Add combat state
            combatRequest.messages.push({
                role: 'system',
                content: await this.getCombatStatePrompt()
            });
            
            // Add recent messages
            combatRequest.messages.push(...recentMessages);
        }
        
        // Adjust generation parameters for combat
        combatRequest.max_tokens = Math.min(combatRequest.max_tokens || 150, 150);
        combatRequest.temperature = 0.7; // More consistent
        
        // Add combat-specific tools
        combatRequest.tools = this.getCombatTools();
        
        return combatRequest;
    }

    /**
     * Get combat endpoint (fallback API)
     */
    getCombatEndpoint(originalUrl) {
        // Check if user has configured combat fallback
        const combatAPI = this.settings.combat?.fallbackAPI;
        
        if (combatAPI) {
            // Use configured fallback (e.g., local model, cheaper API)
            return combatAPI.endpoint;
        }
        
        // Default: try to use same API but with modified settings
        return originalUrl;
    }

    /**
     * Setup message interceptor to detect combat states
     */
    setupMessageInterceptor() {
        // Hook into SillyTavern's message handling
        const context = this.ST.getContext?.();
        
        if (context?.eventSource) {
            context.eventSource.on('message_sent', (data) => {
                this.analyzeMessageForCombat(data.message);
            });
            
            context.eventSource.on('message_received', (data) => {
                this.processReceivedMessage(data.message);
            });
        }
    }

    /**
     * Analyze message for combat triggers
     */
    async analyzeMessageForCombat(message) {
        const combatTriggers = [
            /(\w+)\s+attacks?\s+(?:the\s+)?(\w+)/i,
            /(?:battle|combat|fight)\s+(?:begins|starts)/i,
            /roll.*initiative/i,
            /(\w+)\s+(?:draws|brandishes)\s+(?:a\s+|their\s+)?weapon/i
        ];
        
        for (const trigger of combatTriggers) {
            if (message.match(trigger)) {
                await this.initiateCombatMode(message);
                break;
            }
        }
    }

    /**
     * Process received message for combat end
     */
    async processReceivedMessage(message) {
        if (!this.combatActive) return;
        
        const endTriggers = [
            /(?:combat|battle|fight)\s+(?:ends|over|concluded)/i,
            /(?:victory|defeat|retreat|flee)/i,
            /(?:all\s+)?(?:enemies|foes)\s+(?:defeated|dead|slain)/i
        ];
        
        for (const trigger of endTriggers) {
            if (message.match(trigger)) {
                await this.endCombatMode(message);
                break;
            }
        }
    }

    /**
     * Start combat mode
     */
    async initiateCombatMode(triggerMessage) {
        if (this.combatActive) return;
        
        console.log('[STRES] Initiating combat mode');
        
        // Save current context
        this.originalContext = await this.saveCurrentContext();
        
        // Extract combatants from message
        const combatData = this.extractCombatData(triggerMessage);
        
        // Load combat stats
        this.combatState = await this.loadCombatState(combatData);
        
        // Switch to combat mode
        this.combatActive = true;
        
        // Show combat UI
        this.showCombatUI();
        
        // Notify user
        this.showNotification('Combat Mode Active', 'Using optimized context for faster responses');
        
        return this.combatState;
    }

    /**
     * End combat mode and return to main context
     */
    async endCombatMode(endMessage) {
        if (!this.combatActive) return;
        
        console.log('[STRES] Ending combat mode');
        
        // Calculate combat results
        const results = await this.calculateCombatResults();
        
        // Generate summary
        const summary = this.generateCombatSummary(results);
        
        // Restore main context with summary
        await this.restoreMainContext(summary, results);
        
        // Update character stats
        await this.updatePostCombatStats(results);
        
        // Hide combat UI
        this.hideCombatUI();
        
        // Reset state
        this.combatActive = false;
        this.combatState = null;
        
        // Notify user
        this.showNotification('Combat Complete', `Gained ${results.xp} XP`);
        
        return results;
    }

    /**
     * Setup UI integration
     */
    setupUIIntegration() {
        // Add combat indicator to SillyTavern UI
        const chatBlock = document.querySelector('#chat');
        if (chatBlock) {
            const indicator = document.createElement('div');
            indicator.id = 'stres-combat-indicator';
            indicator.className = 'stres-combat-indicator hidden';
            indicator.innerHTML = `
                <div class="combat-status">
                    <span class="combat-icon">⚔️</span>
                    <span>Combat Mode</span>
                    <span class="combat-info" id="combat-info"></span>
                </div>
            `;
            chatBlock.insertBefore(indicator, chatBlock.firstChild);
        }
        
        // Add combat controls
        this.addCombatControls();
    }

    /**
     * Show combat UI elements
     */
    showCombatUI() {
        const indicator = document.querySelector('#stres-combat-indicator');
        if (indicator) {
            indicator.classList.remove('hidden');
            
            const info = document.querySelector('#combat-info');
            if (info && this.combatState) {
                const enemies = this.combatState.enemies.length;
                info.textContent = `${enemies} ${enemies === 1 ? 'enemy' : 'enemies'}`;
            }
        }
        
        // Show initiative tracker
        this.updateInitiativeTracker();
    }

    /**
     * Hide combat UI elements
     */
    hideCombatUI() {
        const indicator = document.querySelector('#stres-combat-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
        
        // Hide initiative tracker
        const tracker = document.querySelector('#stres-initiative-tracker');
        if (tracker) {
            tracker.classList.add('hidden');
        }
    }

    /**
     * Add combat control buttons
     */
    addCombatControls() {
        const controls = document.createElement('div');
        controls.id = 'stres-combat-controls';
        controls.className = 'stres-combat-controls hidden';
        controls.innerHTML = `
            <button onclick="window.stresIntegration.quickAction('attack')">⚔️ Attack</button>
            <button onclick="window.stresIntegration.quickAction('defend')">🛡️ Defend</button>
            <button onclick="window.stresIntegration.quickAction('spell')">✨ Cast Spell</button>
            <button onclick="window.stresIntegration.quickAction('item')">🧪 Use Item</button>
            <button onclick="window.stresIntegration.endCombatManually()">🏃 Flee</button>
        `;
        
        document.body.appendChild(controls);
    }

    /**
     * Handle quick combat actions
     */
    quickAction(action) {
        const actions = {
            attack: "I attack with my weapon",
            defend: "I take a defensive stance", 
            spell: "I cast a spell",
            item: "I use an item",
            flee: "I attempt to flee from combat"
        };
        
        const message = actions[action];
        if (message) {
            // Send message through SillyTavern
            this.sendMessage(message);
        }
    }

    /**
     * Send message through SillyTavern's interface
     */
    sendMessage(message) {
        const context = this.ST.getContext?.();
        const textarea = document.querySelector('#send_textarea');
        
        if (textarea) {
            textarea.value = message;
            
            // Trigger SillyTavern's send function
            const sendButton = document.querySelector('#send_but');
            if (sendButton) {
                sendButton.click();
            }
        }
    }

    /**
     * Get combat system prompt
     */
    getCombatSystemPrompt() {
        return `You are running tactical RPG combat. Keep responses concise and action-focused.

COMBAT TURN STRUCTURE:
1. Initiative: Fastest acts first
2. Each turn: Move → Action → Bonus Action
3. Roll dice for all attacks and damage
4. Track HP, conditions, positioning

AVAILABLE ACTIONS:
- Attack: roll 1d20+mod vs target AC
- Cast Spell: check MP cost, roll for effects
- Defend: +2 AC until next turn
- Use Item: consume from inventory
- Move: up to 30ft per turn

Always announce whose turn it is. Keep responses under 100 words.
Use tools for all mechanical actions (rolling, damage, status updates).`;
    }

    /**
     * Get current combat state as prompt
     */
    async getCombatStatePrompt() {
        if (!this.combatState) return '';
        
        const state = [];
        state.push('[COMBAT STATE]');
        
        // Initiative order
        if (this.combatState.initiative) {
            state.push(`Initiative: ${this.combatState.initiative.join(' → ')}`);
        }
        
        // Combatant status
        for (const combatant of this.combatState.combatants) {
            const hp = `${combatant.hp.current}/${combatant.hp.max}`;
            const conditions = combatant.conditions.length > 0 ? 
                ` (${combatant.conditions.join(', ')})` : '';
            state.push(`${combatant.name}: ${hp} HP${conditions}`);
        }
        
        // Environment
        if (this.combatState.terrain) {
            state.push(`Terrain: ${this.combatState.terrain}`);
        }
        
        return state.join('\n');
    }

    /**
     * Get combat-specific tools
     */
    getCombatTools() {
        return [
            {
                type: "function",
                function: {
                    name: "roll_attack",
                    description: "Roll attack and damage dice",
                    parameters: {
                        type: "object",
                        properties: {
                            attacker: { type: "string" },
                            target: { type: "string" },
                            weapon: { type: "string" },
                            advantage: { type: "boolean" }
                        },
                        required: ["attacker", "target"]
                    }
                }
            },
            {
                type: "function", 
                function: {
                    name: "update_combat_hp",
                    description: "Update HP for combatant",
                    parameters: {
                        type: "object",
                        properties: {
                            target: { type: "string" },
                            change: { type: "number" },
                            type: { type: "string", enum: ["damage", "healing"] }
                        },
                        required: ["target", "change", "type"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "next_turn",
                    description: "End current turn and move to next combatant",
                    parameters: {
                        type: "object",
                        properties: {
                            current: { type: "string" },
                            next: { type: "string" }
                        }
                    }
                }
            }
        ];
    }

    /**
     * Extract combat data from trigger message
     */
    extractCombatData(message) {
        // Extract participants, weapons, environment
        const attackerMatch = message.match(/(\w+)\s+attacks?\s+(?:the\s+)?(\w+)/i);
        
        return {
            attacker: attackerMatch?.[1] || 'player',
            defender: attackerMatch?.[2] || 'enemy',
            location: this.getCurrentLocation(),
            initiated: Date.now()
        };
    }

    /**
     * Load combat state with stats
     */
    async loadCombatState(combatData) {
        const combatants = [];
        
        // Load player stats
        const player = await this.client.getCurrentCharacter();
        combatants.push({
            id: 'player',
            name: player.name,
            hp: { current: player.stats.hp.current, max: player.stats.hp.max },
            ac: player.stats.ac || 10,
            initiative: null,
            conditions: []
        });
        
        // Load/generate enemies
        const enemy = await this.loadEnemy(combatData.defender);
        combatants.push(enemy);
        
        return {
            combatants,
            currentTurn: 0,
            round: 1,
            initiative: null,
            terrain: combatData.terrain,
            startTime: Date.now()
        };
    }

    /**
     * Save current context before combat
     */
    async saveCurrentContext() {
        const context = this.ST.getContext?.();
        return {
            chat: context?.chat || [],
            characters: context?.characters || [],
            worldInfo: await this.client.getWorldState?.() || {},
            timestamp: Date.now()
        };
    }

    /**
     * Restore main context after combat
     */
    async restoreMainContext(summary, results) {
        // Add combat summary to chat
        const context = this.ST.getContext?.();
        if (context?.addMessageToChat) {
            context.addMessageToChat({
                is_system: true,
                is_user: false,
                mes: summary,
                extra: {
                    type: 'combat_summary',
                    results: results
                }
            });
        }
    }

    /**
     * Show notification to user
     */
    showNotification(title, message) {
        // Use SillyTavern's toast system if available
        if (this.ST.toastr) {
            this.ST.toastr.info(message, title);
        } else {
            // Fallback notification
            console.log(`[STRES] ${title}: ${message}`);
        }
    }

    /**
     * Manual combat end (for flee/surrender)
     */
    endCombatManually() {
        this.endCombatMode("Combat ended manually");
    }

    // Additional helper methods...
    getCurrentLocation() { return 'unknown'; }
    loadEnemy(name) { return { id: name, name, hp: {current: 10, max: 10}, ac: 12 }; }
    calculateCombatResults() { return { xp: 50, loot: [] }; }
    generateCombatSummary(results) { return `Combat complete. Gained ${results.xp} XP.`; }
    updatePostCombatStats(results) { return Promise.resolve(); }
    updateInitiativeTracker() { }
}

// Make globally available
window.SillyTavernIntegration = SillyTavernIntegration;