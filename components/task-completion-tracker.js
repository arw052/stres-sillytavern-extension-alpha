/**
 * Task Completion Tracker for STRES
 * Tracks ongoing tasks and triggers XP/progression on completion
 */

export class TaskCompletionTracker {
    constructor() {
        this.activeTasks = new Map();
        this.completionPatterns = this.defineCompletionPatterns();
    }

    /**
     * Define patterns that indicate task completion
     */
    defineCompletionPatterns() {
        return {
            combat: {
                start: [
                    /attacks?\s+(the\s+)?(\w+)/i,
                    /engages?\s+(the\s+)?(\w+)/i,
                    /fights?\s+(the\s+)?(\w+)/i
                ],
                complete: [
                    /(\w+)\s+(?:is\s+)?(?:defeated|dead|killed|slain)/i,
                    /defeats?\s+(the\s+)?(\w+)/i,
                    /kills?\s+(the\s+)?(\w+)/i,
                    /victory\s+(?:over|against)\s+(the\s+)?(\w+)/i
                ],
                xpTrigger: (task) => ({
                    tool: 'update_character_stats',
                    params: {
                        character: task.character,
                        changes: {
                            xp: task.enemyLevel * 50,
                            skills: { combat: task.enemyLevel * 10 }
                        }
                    }
                })
            },
            
            crafting: {
                start: [
                    /(?:starts?|begins?)\s+(?:crafting|making|creating|forging|brewing|cooking)\s+(.*)/i,
                    /(?:attempts?|tries?)\s+to\s+(?:craft|make|create|forge|brew|cook)\s+(.*)/i
                ],
                complete: [
                    /(?:finishes?|completes?)\s+(?:crafting|making|creating|forging|brewing|cooking)\s+(.*)/i,
                    /(?:successfully|finally)\s+(?:crafts?|makes?|creates?|forges?|brews?|cooks?)\s+(.*)/i,
                    /(\w+)\s+(?:is|are)\s+(?:complete|finished|ready|done)/i
                ],
                xpTrigger: (task) => ({
                    tool: 'learn_skill',
                    params: {
                        character_id: task.character,
                        skill_name: task.skillType,
                        experience_gained: task.itemQuality * 25
                    }
                })
            },
            
            training: {
                start: [
                    /(?:begins?|starts?)\s+(?:training|practicing)\s+(\w+)/i,
                    /(?:spends?|dedicates?)\s+time\s+(?:training|practicing)\s+(\w+)/i
                ],
                complete: [
                    /(?:finishes?|completes?)\s+(?:training|practice)\s+session/i,
                    /(?:hours?|session)\s+of\s+(?:training|practice)\s+(?:ends?|complete)/i,
                    /(?:stops?|ends?)\s+(?:training|practicing)/i
                ],
                xpTrigger: (task) => ({
                    tool: 'learn_skill',
                    params: {
                        character_id: task.character,
                        skill_name: task.skill,
                        practice_hours: task.duration || 1
                    }
                })
            },
            
            social: {
                start: [
                    /(?:begins?|starts?)\s+(?:negotiating|persuading|intimidating|charming)/i,
                    /(?:attempts?|tries?)\s+to\s+(?:negotiate|persuade|intimidate|charm)\s+(.*)/i
                ],
                complete: [
                    /(?:successfully)\s+(?:negotiates?|persuades?|intimidates?|charms?)/i,
                    /(?:deal|agreement|arrangement)\s+(?:is\s+)?(?:struck|made|reached)/i,
                    /(?:wins?|gains?)\s+their\s+(?:trust|favor|agreement)/i
                ],
                xpTrigger: (task) => ({
                    tool: 'learn_skill',
                    params: {
                        character_id: task.character,
                        skill_name: task.socialSkill,
                        experience_gained: 30
                    }
                })
            },
            
            exploration: {
                start: [
                    /(?:begins?|starts?)\s+(?:exploring|searching|investigating)\s+(.*)/i,
                    /(?:enters?|delves?\s+into|ventures?\s+into)\s+(.*)/i
                ],
                complete: [
                    /(?:finishes?|completes?)\s+exploring\s+(.*)/i,
                    /(?:fully)\s+(?:explored|searched|investigated)/i,
                    /(?:exits?|leaves?|emerges?\s+from)\s+(.*)/i
                ],
                xpTrigger: (task) => ({
                    tool: 'update_character_stats',
                    params: {
                        character: task.character,
                        changes: {
                            xp: 25,
                            skills: { exploration: 15 }
                        }
                    }
                })
            },
            
            magic: {
                start: [
                    /(?:begins?|starts?)\s+(?:casting|channeling|weaving)\s+(.*\s+spell)/i,
                    /(?:prepares?|readies?)\s+(.*\s+spell)/i
                ],
                complete: [
                    /(?:successfully)\s+(?:casts?|channels?|weaves?)\s+(.*\s+spell)/i,
                    /spell\s+(?:completes?|succeeds?|takes?\s+effect)/i,
                    /(.*\s+spell)\s+(?:activates?|triggers?|fires?)/i
                ],
                xpTrigger: (task) => ({
                    tool: 'learn_skill',
                    params: {
                        character_id: task.character,
                        skill_name: task.magicSchool,
                        experience_gained: task.spellLevel * 20
                    }
                })
            }
        };
    }

    /**
     * Check if a message indicates task start
     */
    checkTaskStart(message, character = 'player') {
        for (const [taskType, patterns] of Object.entries(this.completionPatterns)) {
            for (const pattern of patterns.start) {
                const match = message.match(pattern);
                if (match) {
                    const taskId = `${taskType}_${Date.now()}`;
                    const task = {
                        id: taskId,
                        type: taskType,
                        character: character,
                        startTime: Date.now(),
                        details: match[1] || match[2] || '',
                        status: 'in_progress'
                    };
                    
                    // Extract additional context
                    this.extractTaskContext(task, message);
                    
                    this.activeTasks.set(taskId, task);
                    console.log(`[TaskTracker] Started ${taskType} task:`, task);
                    
                    return task;
                }
            }
        }
        return null;
    }

    /**
     * Check if a message indicates task completion
     */
    checkTaskCompletion(message) {
        const completedTasks = [];
        
        for (const [taskId, task] of this.activeTasks) {
            if (task.status !== 'in_progress') continue;
            
            const patterns = this.completionPatterns[task.type].complete;
            
            for (const pattern of patterns) {
                if (message.match(pattern)) {
                    task.status = 'completed';
                    task.endTime = Date.now();
                    task.duration = (task.endTime - task.startTime) / 1000 / 60; // minutes
                    
                    // Calculate quality/success based on narrative
                    task.quality = this.assessTaskQuality(message, task);
                    
                    completedTasks.push(task);
                    this.activeTasks.delete(taskId);
                    
                    console.log(`[TaskTracker] Completed ${task.type} task:`, task);
                    break;
                }
            }
        }
        
        return completedTasks;
    }

    /**
     * Extract additional context from task start
     */
    extractTaskContext(task, message) {
        switch (task.type) {
            case 'combat':
                // Extract enemy type and estimate level
                const enemyMatch = message.match(/(?:level\s+)?(\d+)?\s*(\w+)/i);
                if (enemyMatch) {
                    task.enemyLevel = parseInt(enemyMatch[1]) || this.estimateEnemyLevel(enemyMatch[2]);
                    task.enemyType = enemyMatch[2];
                }
                break;
                
            case 'crafting':
                // Extract item type and material
                const craftMatch = message.match(/(?:iron|steel|wood|leather|cloth)\s+(\w+)/i);
                if (craftMatch) {
                    task.itemType = craftMatch[1];
                    task.skillType = this.getSkillFromItem(craftMatch[1]);
                }
                break;
                
            case 'training':
                // Extract skill being trained
                const skillMatch = message.match(/(?:training|practicing)\s+(\w+)/i);
                if (skillMatch) {
                    task.skill = skillMatch[1];
                }
                break;
                
            case 'magic':
                // Extract spell name and school
                const spellMatch = message.match(/(fire|ice|lightning|healing|shield)\s*(\w+)?/i);
                if (spellMatch) {
                    task.magicSchool = spellMatch[1] + '_magic';
                    task.spellLevel = this.estimateSpellLevel(spellMatch[0]);
                }
                break;
        }
    }

    /**
     * Assess task quality based on narrative
     */
    assessTaskQuality(message, task) {
        const qualityIndicators = {
            high: [
                /perfect|flawless|masterful|exceptional|brilliant/i,
                /critical\s+(?:hit|success)/i,
                /with\s+ease/i
            ],
            medium: [
                /successful|good|decent|solid|competent/i,
                /manages?\s+to/i,
                /barely|just\s+(?:manages?|succeeds?)/i
            ],
            low: [
                /barely|struggle|difficult|rough|sloppy/i,
                /with\s+(?:difficulty|effort)/i,
                /almost\s+(?:fails?|loses?)/i
            ]
        };
        
        for (const [quality, patterns] of Object.entries(qualityIndicators)) {
            for (const pattern of patterns) {
                if (message.match(pattern)) {
                    return quality === 'high' ? 3 : quality === 'medium' ? 2 : 1;
                }
            }
        }
        
        return 2; // Default medium quality
    }

    /**
     * Generate XP rewards for completed tasks
     */
    generateXPRewards(completedTasks) {
        const rewards = [];
        
        for (const task of completedTasks) {
            const trigger = this.completionPatterns[task.type].xpTrigger;
            if (trigger) {
                // Adjust rewards based on quality
                const baseReward = trigger(task);
                if (task.quality) {
                    if (baseReward.params.experience_gained) {
                        baseReward.params.experience_gained *= task.quality;
                    }
                    if (baseReward.params.changes?.xp) {
                        baseReward.params.changes.xp *= task.quality;
                    }
                }
                
                rewards.push(baseReward);
            }
        }
        
        return rewards;
    }

    /**
     * Estimate enemy level from type
     */
    estimateEnemyLevel(enemyType) {
        const levels = {
            'goblin': 1, 'rat': 1, 'slime': 1,
            'orc': 3, 'wolf': 2, 'bandit': 3,
            'ogre': 5, 'troll': 6, 'wyvern': 8,
            'dragon': 15, 'demon': 12, 'lich': 14
        };
        return levels[enemyType.toLowerCase()] || 2;
    }

    /**
     * Get crafting skill from item type
     */
    getSkillFromItem(itemType) {
        const skills = {
            'sword': 'blacksmithing', 'armor': 'blacksmithing', 'shield': 'blacksmithing',
            'potion': 'alchemy', 'elixir': 'alchemy', 'poison': 'alchemy',
            'staff': 'woodworking', 'bow': 'woodworking', 'arrow': 'fletching',
            'robe': 'tailoring', 'cloak': 'tailoring', 'boots': 'leatherworking'
        };
        return skills[itemType.toLowerCase()] || 'crafting';
    }

    /**
     * Estimate spell level from name
     */
    estimateSpellLevel(spellName) {
        if (spellName.match(/greater|major|powerful/i)) return 3;
        if (spellName.match(/lesser|minor|weak/i)) return 1;
        return 2;
    }

    /**
     * Get active tasks summary
     */
    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }

    /**
     * Cancel a task
     */
    cancelTask(taskId) {
        const task = this.activeTasks.get(taskId);
        if (task) {
            task.status = 'cancelled';
            this.activeTasks.delete(taskId);
            return task;
        }
        return null;
    }

    /**
     * Clear all tasks
     */
    clearAllTasks() {
        this.activeTasks.clear();
    }
}

// Export for use in tool-integration.js
window.TaskCompletionTracker = TaskCompletionTracker;