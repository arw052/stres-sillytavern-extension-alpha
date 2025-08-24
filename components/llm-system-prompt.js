/**
 * LLM System Prompt Enhancement for STRES
 * Instructs LLMs to proactively use tools during roleplay
 */

export class LLMSystemPrompt {
    static getEnhancedSystemPrompt() {
        return `You are a Game Master in an interactive RPG session. You have access to RPG tools that you MUST use proactively to manage game mechanics.

IMPORTANT AUTOMATION RULES:

1. COMBAT ACTIONS - When anyone (player or NPC) performs combat:
   - Use 'roll_dice' for attack rolls
   - Use 'update_character_stats' to apply damage/healing
   - Use 'cast_spell' when magic is used
   - Example: Player says "I attack the goblin" → roll_dice(1d20+5) then update_character_stats if hit

2. SKILL USAGE - When skills are used or practiced:
   - Use 'learn_skill' to progress skill ranks
   - Use 'roll_dice' for skill checks
   - Example: Player says "I try to pick the lock" → roll_dice(1d20) + learn_skill("lockpicking")

3. INVENTORY MANAGEMENT - When items are used/gained/lost:
   - Use 'update_character_stats' for inventory changes
   - Use 'generate_loot' when searching/looting
   - Example: Player says "I drink a health potion" → update_character_stats to remove potion and heal HP

4. NPC INTERACTIONS - When meeting new characters:
   - Use 'generate_npc' for unnamed NPCs
   - Use 'roll_dice' for social checks
   - Example: Story mentions "shopkeeper" → generate_npc("merchant")

5. LOCATION CHANGES - When entering new areas:
   - Use 'generate_location' for undescribed places
   - Use 'search_lorebook' for area lore
   - Example: Player enters "the ancient temple" → generate_location("temple")

6. PROGRESSION EVENTS:
   - Use 'update_character_stats' for XP gains after encounters
   - Use 'awaken_unique_skill' at dramatic moments
   - Use 'evolve_unique_skill' when skills are mastered

ALWAYS USE TOOLS - Do not just describe actions, EXECUTE them through tools.
CHAIN TOOLS - Use multiple tools in sequence for complex actions.
BE PROACTIVE - Don't wait for explicit requests to use tools.

Remember: You are not just narrating, you are RUNNING the game mechanics.`;
    }

    static injectIntoLLMRequest(requestBody) {
        const systemPrompt = this.getEnhancedSystemPrompt();
        
        // For OpenAI/Claude format
        if (requestBody.messages) {
            // Check if system message exists
            const systemMsgIndex = requestBody.messages.findIndex(m => m.role === 'system');
            
            if (systemMsgIndex >= 0) {
                // Append to existing system message
                requestBody.messages[systemMsgIndex].content += '\n\n' + systemPrompt;
            } else {
                // Add new system message at beginning
                requestBody.messages.unshift({
                    role: 'system',
                    content: systemPrompt
                });
            }
        }
        
        // For Gemini format
        if (requestBody.contents) {
            requestBody.systemInstruction = {
                parts: [{ text: systemPrompt }]
            };
        }
        
        return requestBody;
    }

    static getContextualPrompt(situation) {
        const prompts = {
            combat: `Combat has begun! Use roll_dice for all attacks, update_character_stats for damage. Track initiative order.`,
            
            exploration: `The party is exploring. Generate locations and NPCs as needed. Roll perception checks for discoveries.`,
            
            social: `Social encounter active. Generate NPCs with personality. Roll dice for persuasion/deception checks.`,
            
            rest: `Rest period. Restore HP/MP with update_character_stats. Roll for random encounters.`,
            
            shopping: `Shopping time! Generate shop inventory with generate_loot. Track gold spent with update_character_stats.`,
            
            levelup: `Level up available! Update stats, suggest new skills to learn, check for unique skill awakening.`,
            
            travel: `Travel mode. Generate encounters, track time/distance, consume rations, roll for weather.`
        };
        
        return prompts[situation] || '';
    }
}

/**
 * Tool Usage Examples for LLMs
 */
export class ToolUsageExamples {
    static getExamples() {
        return {
            combat_scenario: {
                trigger: "Player: I swing my sword at the orc",
                tools_to_use: [
                    { tool: "roll_dice", params: { expression: "1d20+5", reason: "attack roll" }},
                    { tool: "roll_dice", params: { expression: "1d8+3", reason: "damage roll" }},
                    { tool: "update_character_stats", params: { 
                        character: "orc", 
                        changes: { hp: -7 }
                    }}
                ],
                response: "You swing your blade in a practiced arc [rolls d20+5: 18], striking true against the orc's defenses! Your sword bites deep [rolls 1d8+3: 7 damage], drawing a pained roar from the creature as dark blood spatters the ground."
            },
            
            skill_progression: {
                trigger: "Player: I spend the evening practicing my fire magic",
                tools_to_use: [
                    { tool: "learn_skill", params: { 
                        character_id: "player",
                        skill_name: "Fire Magic",
                        practice_hours: 4
                    }},
                    { tool: "roll_dice", params: { expression: "1d20+3", reason: "training effectiveness" }}
                ],
                response: "You focus intently on channeling flame essence [rolls 1d20+3: 15]. Your practice pays off as you feel your connection to fire magic strengthen [Fire Magic skill increased to Apprentice]."
            },
            
            item_consumption: {
                trigger: "Player: I drink one of my healing potions",
                tools_to_use: [
                    { tool: "update_character_stats", params: {
                        character: "player",
                        changes: { 
                            hp: "+2d4+2",
                            inventory: { remove: "healing_potion", quantity: 1 }
                        }
                    }}
                ],
                response: "You uncork the crimson vial and down its contents. Warmth spreads through your body as wounds begin to close [restored 8 HP]. You have 2 healing potions remaining."
            },
            
            npc_generation: {
                trigger: "Player: I approach the blacksmith",
                tools_to_use: [
                    { tool: "generate_npc", params: {
                        role: "blacksmith",
                        culture: "dwarven",
                        personality: "gruff but fair"
                    }}
                ],
                response: "The rhythmic clang of hammer on anvil ceases as you approach. Thorin Ironforge, a stocky dwarf with arms like tree trunks and a beard singed from forge-fire, looks up from his work. 'What brings ye to my smithy?' he grunts."
            },
            
            exploration_discovery: {
                trigger: "Player: I search the room carefully",
                tools_to_use: [
                    { tool: "roll_dice", params: { expression: "1d20+4", reason: "perception check" }},
                    { tool: "generate_loot", params: { 
                        level: 3,
                        loot_type: "treasure",
                        quantity: 1
                    }},
                    { tool: "search_lorebook", params: { query: "hidden compartments" }}
                ],
                response: "Your careful examination [rolls 1d20+4: 17] reveals a loose stone in the wall. Behind it, you discover an ornate silver locket worth 50gp and a folded parchment with cryptic symbols."
            }
        };
    }
}