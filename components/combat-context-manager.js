/**
 * Combat Context Manager for STRES
 * Switches to lightweight combat-specific LLM context during battles
 */

export class CombatContextManager {
    constructor(client, settings) {
        this.client = client;
        this.settings = settings;
        this.mainContext = null;
        this.combatContext = null;
        this.inCombat = false;
        this.combatants = [];
    }

    /**
     * Detect combat initiation from narrative
     */
    detectCombatStart(message) {
        const combatTriggers = [
            /(\w+)\s+attacks?\s+(?:the\s+)?(\w+)/i,
            /battle\s+begins/i,
            /roll\s+(?:for\s+)?initiative/i,
            /combat\s+(?:starts|begins|initiated)/i,
            /(\w+)\s+charges?\s+(?:at\s+)?(?:the\s+)?(\w+)/i,
            /hostile\s+intent/i
        ];

        for (const trigger of combatTriggers) {
            const match = message.match(trigger);
            if (match) {
                return {
                    triggered: true,
                    attacker: match[1] || 'player',
                    defender: match[2] || 'enemy'
                };
            }
        }
        return { triggered: false };
    }

    /**
     * Initialize combat mode with minimal context
     */
    async startCombatMode(combatData) {
        console.log('[Combat] Switching to combat context');
        
        // Store main conversation context
        this.mainContext = await this.saveMainContext();
        
        // Extract only combat-relevant information
        const combatContext = {
            // Minimal system prompt for combat
            systemPrompt: this.getCombatSystemPrompt(),
            
            // Only recent location and involved characters
            worldState: {
                location: combatData.location || this.getCurrentLocation(),
                terrain: combatData.terrain,
                lighting: combatData.lighting || 'normal'
            },
            
            // Combatant stats only
            combatants: await this.loadCombatantStats(combatData),
            
            // Last 2-3 messages for context
            recentHistory: this.getMinimalHistory(),
            
            // Combat-specific tools only
            tools: this.getCombatTools(),
            
            // Token budget
            maxTokens: 4000 // Much smaller than main context
        };

        // Signal to SillyTavern to use combat context
        await this.switchToLightweightContext(combatContext);
        
        this.inCombat = true;
        this.combatContext = combatContext;
        
        return combatContext;
    }

    /**
     * Combat-specific system prompt (minimal)
     */
    getCombatSystemPrompt() {
        return `You are managing tactical combat. Be concise and action-focused.

COMBAT RULES:
- Each turn: Movement → Action → Bonus Action → Reactions
- Always roll dice for attacks and damage
- Track HP, conditions, and positions
- Describe actions cinematically but briefly

AVAILABLE ACTIONS:
- Attack: roll d20+mod vs AC
- Cast Spell: check MP cost, roll effects
- Defend: +2 AC until next turn
- Move: up to 30ft per turn
- Use Item: consume from inventory

Track initiative order and announce whose turn it is.
Keep responses under 100 words per turn.`;
    }

    /**
     * Load only combat-relevant stats
     */
    async loadCombatantStats(combatData) {
        const combatants = [];
        
        // Player stats
        const player = await this.client.getCharacter(combatData.playerId);
        combatants.push({
            id: player.id,
            name: player.name,
            hp: player.stats.hp,
            mp: player.stats.mp,
            ac: player.stats.ac || 10 + player.stats.dexterity_modifier,
            initiative: null,
            attacks: player.weapons || ['unarmed'],
            spells: player.known_spells?.slice(0, 5), // Limit spell list
            conditions: [],
            position: { x: 0, y: 0 }
        });

        // Enemy stats (generated or loaded)
        for (const enemy of combatData.enemies || []) {
            const enemyStats = await this.loadOrGenerateEnemy(enemy);
            combatants.push({
                id: enemyStats.id,
                name: enemyStats.name,
                hp: enemyStats.hp,
                ac: enemyStats.ac,
                initiative: null,
                attacks: enemyStats.attacks,
                conditions: [],
                position: enemyStats.position
            });
        }

        return combatants;
    }

    /**
     * Minimal conversation history (2-3 messages)
     */
    getMinimalHistory() {
        const fullHistory = SillyTavern?.getContext()?.chat || [];
        return fullHistory.slice(-3).map(msg => ({
            role: msg.is_user ? 'user' : 'assistant',
            content: msg.mes.substring(0, 200) // Truncate long messages
        }));
    }

    /**
     * Combat-only tools (reduced set)
     */
    getCombatTools() {
        return [
            {
                name: 'roll_attack',
                description: 'Roll attack and damage',
                parameters: {
                    attacker: 'string',
                    target: 'string',
                    weapon: 'string',
                    advantage: 'boolean'
                }
            },
            {
                name: 'cast_combat_spell',
                description: 'Cast spell in combat',
                parameters: {
                    caster: 'string',
                    spell: 'string',
                    targets: 'array'
                }
            },
            {
                name: 'update_hp',
                description: 'Update HP for combatant',
                parameters: {
                    target: 'string',
                    change: 'number'
                }
            },
            {
                name: 'apply_condition',
                description: 'Apply status condition',
                parameters: {
                    target: 'string',
                    condition: 'string',
                    duration: 'number'
                }
            },
            {
                name: 'end_turn',
                description: 'End current turn',
                parameters: {
                    next_combatant: 'string'
                }
            }
        ];
    }

    /**
     * Handle combat messages with lightweight context
     */
    async processCombatMessage(message) {
        // Combat actions are very simple
        const actionPatterns = {
            attack: /(?:attack|strike|hit|slash|stab|shoot)/i,
            spell: /(?:cast|spell|magic)/i,
            defend: /(?:defend|dodge|parry|block)/i,
            move: /(?:move|run|charge|retreat)/i,
            item: /(?:use|drink|throw)/i
        };

        // Detect action type
        for (const [action, pattern] of Object.entries(actionPatterns)) {
            if (message.match(pattern)) {
                return this.executeAction(action, message);
            }
        }
    }

    /**
     * Execute combat action with minimal processing
     */
    async executeAction(actionType, message) {
        const response = {
            action: actionType,
            rolls: [],
            effects: [],
            narration: ''
        };

        switch (actionType) {
            case 'attack':
                response.rolls.push({
                    type: 'attack',
                    roll: `1d20+${this.getCurrentAttackBonus()}`,
                    damage: `1d8+${this.getCurrentDamageBonus()}`
                });
                break;
                
            case 'spell':
                const spell = this.extractSpellName(message);
                response.effects.push({
                    type: 'spell',
                    name: spell,
                    mpCost: this.getSpellCost(spell)
                });
                break;
        }

        return response;
    }

    /**
     * Detect combat end and restore main context
     */
    async detectCombatEnd(message) {
        const endTriggers = [
            /(?:combat|battle|fight)\s+(?:ends|over|finished)/i,
            /(?:all\s+)?(?:enemies|foes)\s+(?:defeated|dead|slain)/i,
            /(?:victory|flee|retreat|escape)/i,
            /(?:surrender|yield|mercy)/i
        ];

        for (const trigger of endTriggers) {
            if (message.match(trigger)) {
                return true;
            }
        }

        // Also check if all enemies are at 0 HP
        const livingEnemies = this.combatants.filter(c => 
            c.id !== 'player' && c.hp.current > 0
        );
        
        return livingEnemies.length === 0;
    }

    /**
     * End combat and restore main context
     */
    async endCombatMode() {
        console.log('[Combat] Returning to main context');
        
        // Calculate combat rewards
        const rewards = this.calculateCombatRewards();
        
        // Create combat summary for main context
        const summary = this.generateCombatSummary();
        
        // Restore main conversation with summary
        await this.restoreMainContext(summary, rewards);
        
        this.inCombat = false;
        this.combatContext = null;
        this.combatants = [];
        
        return { summary, rewards };
    }

    /**
     * Calculate XP and loot from combat
     */
    calculateCombatRewards() {
        const defeatedEnemies = this.combatants.filter(c => 
            c.id !== 'player' && c.hp.current <= 0
        );

        const totalXP = defeatedEnemies.reduce((sum, enemy) => 
            sum + (enemy.level || 1) * 50, 0
        );

        return {
            xp: totalXP,
            loot: [], // Would generate based on enemies
            skillProgress: {
                combat: Math.floor(totalXP / 10),
                weaponSkill: Math.floor(totalXP / 20)
            }
        };
    }

    /**
     * Generate summary of combat for main context
     */
    generateCombatSummary() {
        const rounds = this.combatContext?.rounds || 1;
        const defeated = this.combatants.filter(c => 
            c.id !== 'player' && c.hp.current <= 0
        ).map(c => c.name);

        const playerHP = this.combatants.find(c => c.id === 'player')?.hp;
        
        return `[Combat Summary: ${rounds} rounds, defeated ${defeated.join(', ')}. 
                Player HP: ${playerHP?.current}/${playerHP?.max}]`;
    }

    /**
     * Switch to lightweight LLM context
     */
    async switchToLightweightContext(combatContext) {
        // This would integrate with SillyTavern's API
        const switchRequest = {
            type: 'context_switch',
            mode: 'combat',
            context: combatContext,
            settings: {
                max_tokens: 150, // Short responses
                temperature: 0.7, // More deterministic
                model: this.settings.combatModel || 'gpt-3.5-turbo' // Cheaper/faster model
            }
        };

        // Signal to SillyTavern extension
        if (window.SillyTavern?.getContext) {
            const context = window.SillyTavern.getContext();
            context.eventSource?.emit('stres_combat_mode', switchRequest);
        }

        return switchRequest;
    }

    /**
     * Restore main conversation context
     */
    async restoreMainContext(summary, rewards) {
        const restoreRequest = {
            type: 'context_restore',
            mode: 'main',
            summary: summary,
            rewards: rewards,
            updates: {
                character_hp: this.combatants.find(c => c.id === 'player')?.hp,
                xp_gained: rewards.xp,
                items_gained: rewards.loot
            }
        };

        if (window.SillyTavern?.getContext) {
            const context = window.SillyTavern.getContext();
            context.eventSource?.emit('stres_main_mode', restoreRequest);
        }

        return restoreRequest;
    }

    /**
     * Save current main context
     */
    async saveMainContext() {
        return {
            messages: SillyTavern?.getContext()?.chat || [],
            worldState: await this.client.getWorldState(),
            timestamp: Date.now()
        };
    }

    /**
     * Get current location from context
     */
    getCurrentLocation() {
        // Would extract from character data or recent messages
        return 'current location';
    }

    /**
     * Load or generate enemy stats
     */
    async loadOrGenerateEnemy(enemyRef) {
        if (typeof enemyRef === 'string') {
            // Generate based on type
            return this.client.generateMonster({
                type: enemyRef,
                level: this.estimateEnemyLevel(enemyRef)
            });
        }
        return enemyRef;
    }

    /**
     * Estimate enemy level from type
     */
    estimateEnemyLevel(enemyType) {
        const levels = {
            'goblin': 1, 'orc': 3, 'ogre': 5,
            'dragon': 15, 'lich': 14
        };
        return levels[enemyType.toLowerCase()] || 2;
    }

    /**
     * Get current attack bonus
     */
    getCurrentAttackBonus() {
        const player = this.combatants.find(c => c.id === 'player');
        return player?.attackBonus || 3;
    }

    /**
     * Get current damage bonus
     */
    getCurrentDamageBonus() {
        const player = this.combatants.find(c => c.id === 'player');
        return player?.damageBonus || 2;
    }

    /**
     * Extract spell name from message
     */
    extractSpellName(message) {
        const match = message.match(/cast\s+(\w+)/i);
        return match?.[1] || 'unknown spell';
    }

    /**
     * Get spell MP cost
     */
    getSpellCost(spellName) {
        const costs = {
            'fireball': 5, 'heal': 3, 'shield': 2
        };
        return costs[spellName.toLowerCase()] || 3;
    }
}

// Export for use
window.CombatContextManager = CombatContextManager;