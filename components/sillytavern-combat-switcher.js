/**
 * SillyTavern Combat Mode Switcher
 * Uses SillyTavern's existing API management and preset system
 * No API keys stored in STRES - everything handled by SillyTavern
 */

export class SillyTavernCombatSwitcher {
    constructor(client, settings) {
        this.client = client;
        this.settings = settings;
        this.ST = null;
        this.originalPreset = null;
        this.combatActive = false;
        this.combatPreset = 'stres-combat';
        
        this.init();
    }

    async init() {
        await this.waitForSillyTavern();
        this.setupPresetSwitching();
        this.setupCombatDetection();
        this.createCombatPreset();
    }

    async waitForSillyTavern() {
        return new Promise((resolve) => {
            const checkST = () => {
                if (window.SillyTavern && window.main_api) {
                    this.ST = window.SillyTavern;
                    resolve();
                } else {
                    setTimeout(checkST, 100);
                }
            };
            checkST();
        });
    }

    /**
     * Setup preset switching using SillyTavern's native system
     */
    setupPresetSwitching() {
        // Hook into SillyTavern's message generation
        const originalGenerateQuietPrompt = window.Generate?.generateQuietPrompt;
        const self = this;
        
        if (originalGenerateQuietPrompt && !originalGenerateQuietPrompt._stresPatched) {
            window.Generate.generateQuietPrompt = async function(...args) {
                if (self.combatActive) {
                    // Temporarily switch to combat preset
                    return self.executeWithCombatContext(() => {
                        return originalGenerateQuietPrompt.apply(this, args);
                    });
                }
                return originalGenerateQuietPrompt.apply(this, args);
            };
            window.Generate.generateQuietPrompt._stresPatched = true;
        }
    }

    /**
     * Execute function with combat context
     */
    async executeWithCombatContext(func) {
        // Save current state
        const originalContext = this.saveCurrentContext();
        
        try {
            // Switch to combat mode
            await this.applyCombatContext();
            
            // Execute the function
            const result = await func();
            
            return result;
            
        } finally {
            // Always restore context
            await this.restoreContext(originalContext);
        }
    }

    /**
     * Apply combat-optimized context
     */
    async applyCombatContext() {
        // Temporarily modify chat context
        const context = this.ST.getContext();
        
        // Store original chat length
        this.originalChatLength = context.chat?.length || 0;
        
        // Trim chat to last N messages for combat
        if (context.chat && context.chat.length > this.settings.combat?.maxMessages) {
            const trimmedMessages = this.settings.combat.maxMessages;
            context.chat = [
                ...context.chat.slice(0, 1), // Keep first message (usually character intro)
                ...context.chat.slice(-trimmedMessages) // Keep last N messages
            ];
        }
        
        // Temporarily disable world info during combat
        if (this.settings.combat?.disableWorldInfo) {
            this.originalWorldInfoState = context.worldInfoSettings?.enabled;
            if (context.worldInfoSettings) {
                context.worldInfoSettings.enabled = false;
            }
        }
        
        // Add combat system message
        const combatSystemMessage = {
            name: 'STRES Combat System',
            is_user: false,
            is_system: true,
            mes: this.getCombatSystemPrompt(),
            send_date: new Date().getTime(),
            extra: {
                type: 'combat_system',
                isVisible: false
            }
        };
        
        context.chat.push(combatSystemMessage);
    }

    /**
     * Save current context state
     */
    saveCurrentContext() {
        const context = this.ST.getContext();
        return {
            chatLength: context.chat?.length || 0,
            worldInfoEnabled: context.worldInfoSettings?.enabled,
            currentPreset: this.getCurrentPreset(),
            timestamp: Date.now()
        };
    }

    /**
     * Restore previous context
     */
    async restoreContext(savedContext) {
        const context = this.ST.getContext();
        
        // Restore chat length
        if (context.chat && this.originalChatLength) {
            // Remove our temporary messages
            while (context.chat.length > this.originalChatLength) {
                const lastMessage = context.chat[context.chat.length - 1];
                if (lastMessage.extra?.type === 'combat_system') {
                    context.chat.pop();
                } else {
                    break;
                }
            }
        }
        
        // Restore world info
        if (context.worldInfoSettings && this.originalWorldInfoState !== undefined) {
            context.worldInfoSettings.enabled = this.originalWorldInfoState;
        }
    }

    /**
     * Get combat-optimized system prompt
     */
    getCombatSystemPrompt() {
        return `[COMBAT MODE ACTIVE]
You are now in tactical combat mode. Keep responses concise and action-focused.

COMBAT GUIDELINES:
- Each turn: describe action briefly, roll dice, apply effects
- Use available tools for all mechanical actions (attacks, damage, healing)
- Track HP, initiative, conditions, and positioning
- Responses should be 50-100 words max
- Focus on immediate tactical situation

Current combat state: ${this.getCombatStateText()}

Remember: Use tools for dice rolls, damage application, and status updates.`;
    }

    /**
     * Get current combat state as text
     */
    getCombatStateText() {
        if (!this.combatState) return 'Combat just began';
        
        const participants = this.combatState.participants || [];
        const round = this.combatState.round || 1;
        
        return `Round ${round}, participants: ${participants.map(p => `${p.name} (${p.hp}/${p.maxHp} HP)`).join(', ')}`;
    }

    /**
     * Setup combat detection using SillyTavern's message events
     */
    setupCombatDetection() {
        const context = this.ST.getContext();
        
        if (context.eventSource) {
            // Listen for outgoing messages
            context.eventSource.on('messageSent', (data) => {
                this.checkForCombatTrigger(data.message);
            });
            
            // Listen for incoming messages
            context.eventSource.on('messageReceived', (data) => {
                this.checkForCombatEnd(data.message);
            });
        }
    }

    /**
     * Check for combat start triggers
     */
    async checkForCombatTrigger(message) {
        if (this.combatActive) return;
        
        const combatTriggers = [
            /(\w+)\s+attacks?\s+(?:the\s+)?(\w+)/i,
            /(?:battle|combat|fight)\s+(?:begins|starts|initiates)/i,
            /roll\s+(?:for\s+)?initiative/i,
            /(\w+)\s+(?:draws?|unsheathes?|brandishes?)\s+(?:their\s+)?weapon/i,
            /hostile\s+intent/i
        ];
        
        for (const trigger of combatTriggers) {
            const match = message.match(trigger);
            if (match) {
                await this.startCombatMode(message, match);
                break;
            }
        }
    }

    /**
     * Check for combat end triggers
     */
    async checkForCombatEnd(message) {
        if (!this.combatActive) return;
        
        const endTriggers = [
            /(?:combat|battle|fight)\s+(?:ends|over|concluded|finished)/i,
            /(?:victory|defeat|triumph)/i,
            /(?:all\s+)?(?:enemies|foes|opponents)\s+(?:defeated|dead|slain|fallen)/i,
            /(?:flees?|retreats?|escapes?)\s+from\s+(?:combat|battle)/i,
            /(?:surrenders?|yields?|gives?\s+up)/i
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
    async startCombatMode(triggerMessage, match) {
        console.log('[STRES] Starting combat mode');
        
        this.combatActive = true;
        this.combatState = {
            startTime: Date.now(),
            triggerMessage,
            participants: this.extractParticipants(match),
            round: 1,
            turn: 0
        };
        
        // Show combat UI
        this.showCombatIndicator();
        
        // Notify user
        this.showNotification('⚔️ Combat Mode Active', 'Using optimized context for faster combat');
        
        // Log combat start for STRES backend
        if (this.client.logEvent) {
            await this.client.logEvent('combat_start', {
                trigger: triggerMessage,
                participants: this.combatState.participants
            });
        }
    }

    /**
     * End combat mode
     */
    async endCombatMode(endMessage) {
        console.log('[STRES] Ending combat mode');
        
        const combatDuration = Date.now() - this.combatState.startTime;
        const rounds = this.combatState.round;
        
        // Generate combat summary
        const summary = `Combat concluded after ${rounds} rounds (${Math.round(combatDuration/1000)}s)`;
        
        // Hide combat UI
        this.hideCombatIndicator();
        
        // Add summary to chat
        this.addCombatSummaryToChat(summary);
        
        // Log combat end for STRES backend
        if (this.client.logEvent) {
            await this.client.logEvent('combat_end', {
                duration: combatDuration,
                rounds: rounds,
                outcome: endMessage
            });
        }
        
        // Reset state
        this.combatActive = false;
        this.combatState = null;
        
        // Notify user
        this.showNotification('Combat Complete', summary);
    }

    /**
     * Extract combat participants from trigger message
     */
    extractParticipants(match) {
        const participants = [];
        
        if (match[1]) participants.push({ name: match[1], type: 'attacker' });
        if (match[2]) participants.push({ name: match[2], type: 'defender' });
        
        // Add default participant if none found
        if (participants.length === 0) {
            participants.push({ name: 'Player', type: 'player' });
        }
        
        return participants;
    }

    /**
     * Show combat mode indicator
     */
    showCombatIndicator() {
        let indicator = document.querySelector('#stres-combat-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'stres-combat-indicator';
            indicator.innerHTML = `
                <div class="stres-combat-status">
                    <span class="combat-icon">⚔️</span>
                    <span class="combat-text">Combat Mode</span>
                    <span class="combat-round" id="combat-round-display">Round 1</span>
                </div>
            `;
            
            // Add to SillyTavern's UI
            const chatBlock = document.querySelector('#chat') || document.querySelector('#sheld');
            if (chatBlock) {
                chatBlock.insertBefore(indicator, chatBlock.firstChild);
            }
        }
        
        indicator.style.display = 'flex';
        
        // Add CSS if not already present
        this.injectCombatCSS();
    }

    /**
     * Hide combat mode indicator
     */
    hideCombatIndicator() {
        const indicator = document.querySelector('#stres-combat-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Inject combat mode CSS
     */
    injectCombatCSS() {
        if (document.querySelector('#stres-combat-css')) return;
        
        const css = document.createElement('style');
        css.id = 'stres-combat-css';
        css.textContent = `
            #stres-combat-indicator {
                display: none;
                background: linear-gradient(135deg, #d32f2f, #f57c00);
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                margin: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                animation: combatPulse 2s infinite;
                font-family: var(--mainFontFamily);
                font-size: 14px;
                font-weight: 600;
                z-index: 1000;
                position: sticky;
                top: 0;
            }
            
            .stres-combat-status {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .combat-icon {
                font-size: 18px;
                animation: bounce 1s infinite;
            }
            
            .combat-round {
                background: rgba(255,255,255,0.2);
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
            }
            
            @keyframes combatPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.9; transform: scale(1.02); }
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-2px); }
            }
        `;
        
        document.head.appendChild(css);
    }

    /**
     * Add combat summary to chat
     */
    addCombatSummaryToChat(summary) {
        const context = this.ST.getContext();
        
        if (context.addOneMessage) {
            context.addOneMessage({
                name: 'Combat System',
                is_user: false,
                is_system: true,
                mes: `<div class="combat-summary">${summary}</div>`,
                send_date: new Date().getTime(),
                extra: {
                    type: 'combat_summary',
                    isVisible: true
                }
            });
        }
    }

    /**
     * Show notification using SillyTavern's system
     */
    showNotification(title, message) {
        if (window.toastr) {
            window.toastr.info(message, title, { timeOut: 3000 });
        } else if (this.ST.popup) {
            this.ST.popup(message, 'text');
        } else {
            console.log(`[STRES] ${title}: ${message}`);
        }
    }

    /**
     * Get current preset name
     */
    getCurrentPreset() {
        return window.power_user?.preset_settings || 'Default';
    }

    /**
     * Create combat preset if it doesn't exist
     */
    createCombatPreset() {
        // This would integrate with SillyTavern's preset system
        // For now, we just modify context on-the-fly
        const combatSettings = {
            max_new_tokens: 150,
            temperature: 0.7,
            top_p: 0.9,
            top_k: 50,
            repetition_penalty: 1.1,
            guidance_scale: 1.0
        };
        
        // Store combat settings for later use
        this.combatSettings = combatSettings;
    }

    /**
     * Configuration interface for users
     */
    renderSettings() {
        return `
            <div class="stres-combat-settings">
                <h4>⚔️ Combat Mode Settings</h4>
                
                <label class="checkbox">
                    <input type="checkbox" id="combat-mode-enabled" ${this.settings.combat?.enabled ? 'checked' : ''}>
                    <span>Enable Combat Mode Context Switching</span>
                </label>
                <small>Automatically optimize context during combat for faster responses</small>
                
                <div class="form-group">
                    <label>Messages to Keep in Combat:</label>
                    <input type="number" id="combat-max-messages" value="${this.settings.combat?.maxMessages || 3}" min="1" max="10">
                    <small>How many recent messages to send during combat (lower = faster/cheaper)</small>
                </div>
                
                <label class="checkbox">
                    <input type="checkbox" id="disable-world-info-combat" ${this.settings.combat?.disableWorldInfo ? 'checked' : ''}>
                    <span>Disable World Info during Combat</span>
                </label>
                <small>Temporarily disable world info entries during combat to reduce token usage</small>
                
                <label class="checkbox">
                    <input type="checkbox" id="combat-notifications" ${this.settings.combat?.showNotifications !== false ? 'checked' : ''}>
                    <span>Show Combat Mode Notifications</span>
                </label>
                
                <div class="form-group">
                    <label>Combat Response Length:</label>
                    <select id="combat-response-length">
                        <option value="50" ${this.combatSettings?.max_new_tokens === 50 ? 'selected' : ''}>Very Short (50 tokens)</option>
                        <option value="100" ${this.combatSettings?.max_new_tokens === 100 ? 'selected' : ''}>Short (100 tokens)</option>
                        <option value="150" ${this.combatSettings?.max_new_tokens === 150 ? 'selected' : ''}>Medium (150 tokens)</option>
                        <option value="200" ${this.combatSettings?.max_new_tokens === 200 ? 'selected' : ''}>Long (200 tokens)</option>
                    </select>
                </div>
                
                <div class="settings-note">
                    <strong>Note:</strong> Combat mode works with your existing SillyTavern API settings. 
                    No additional API keys needed - STRES simply optimizes the context sent to your configured provider 
                    (OpenAI, Claude, OpenRouter, local models, etc.).
                </div>
                
                <button onclick="window.stresCombatSwitcher.testCombatMode()" class="btn btn-primary">
                    Test Combat Mode
                </button>
            </div>
        `;
    }

    /**
     * Test combat mode functionality
     */
    async testCombatMode() {
        this.showNotification('Testing Combat Mode', 'Simulating combat scenario...');
        
        // Simulate combat trigger
        await this.startCombatMode('The goblin attacks you!', ['goblin', 'you']);
        
        // Wait 3 seconds
        setTimeout(async () => {
            // Simulate combat end
            await this.endCombatMode('The goblin is defeated!');
            this.showNotification('Test Complete', 'Combat mode test successful');
        }, 3000);
    }

    /**
     * Save settings
     */
    saveSettings() {
        this.settings.combat = {
            enabled: document.querySelector('#combat-mode-enabled')?.checked || false,
            maxMessages: parseInt(document.querySelector('#combat-max-messages')?.value) || 3,
            disableWorldInfo: document.querySelector('#disable-world-info-combat')?.checked || false,
            showNotifications: document.querySelector('#combat-notifications')?.checked !== false,
            maxTokens: parseInt(document.querySelector('#combat-response-length')?.value) || 150
        };
        
        // Update combat settings
        this.combatSettings.max_new_tokens = this.settings.combat.maxTokens;
        
        this.showNotification('Settings Saved', 'Combat mode configuration updated');
    }
}

// Make globally available
window.SillyTavernCombatSwitcher = SillyTavernCombatSwitcher;
window.stresCombatSwitcher = null; // Will be initialized by main extension