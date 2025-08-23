export class CommandProcessor {
    constructor(client, settings) {
        this.client = client;
        this.settings = settings;
        this.character = null;
    }

    setCharacter(character) {
        this.character = character;
    }

    async getCharacterStats() {
        if (!this.character) {
            return "No character loaded. Use /stres_campaign to load a campaign.";
        }

        const data = this.character.data;
        return `**${this.character.name} - Level ${data.level}**
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

**Skills:** ${data.skills.join(', ') || 'None'}`;
    }

    async getInventory() {
        if (!this.character) {
            return "No character loaded. Use /stres_campaign to load a campaign.";
        }

        const data = this.character.data;
        if (data.inventory.length === 0) {
            return "**Inventory**\\n────────────────\\n*Empty*";
        }

        let inventory = "**Inventory**\\n────────────────\\n";
        data.inventory.forEach(item => {
            inventory += `• ${item.item}`;
            if (item.quantity > 1) inventory += ` (x${item.quantity})`;
            if (item.description) inventory += `\\n  *${item.description}*`;
            inventory += "\\n";
        });

        return inventory;
    }

    async getJournal() {
        if (!this.settings.campaignId) {
            return "No campaign loaded. Use /stres_campaign to load a campaign.";
        }

        try {
            const events = await this.client.getWorldStates(this.settings.campaignId, 'event');
            if (events.length === 0) {
                return "**Quest Journal**\\n────────────────\\n*No entries*";
            }

            let journal = "**Quest Journal**\\n────────────────\\n";
            events.forEach(event => {
                journal += `**${event.name}**\\n`;
                if (event.data.description) {
                    journal += `${event.data.description}\\n`;
                }
                journal += "\\n";
            });

            return journal;
        } catch (error) {
            return "Failed to retrieve journal entries.";
        }
    }

    async getWorldInfo() {
        if (!this.settings.campaignId) {
            return "No campaign loaded. Use /stres_campaign to load a campaign.";
        }

        try {
            const locations = await this.client.getWorldStates(this.settings.campaignId, 'location');
            const npcs = await this.client.getWorldStates(this.settings.campaignId, 'npc');

            let worldInfo = "**World Information**\\n────────────────\\n";
            
            if (locations.length > 0) {
                worldInfo += "\\n**Known Locations:**\\n";
                locations.forEach(loc => {
                    worldInfo += `• ${loc.name}`;
                    if (loc.data.description) {
                        worldInfo += `: ${loc.data.description}`;
                    }
                    worldInfo += "\\n";
                });
            }

            if (npcs.length > 0) {
                worldInfo += "\\n**Known NPCs:**\\n";
                npcs.forEach(npc => {
                    worldInfo += `• ${npc.name}`;
                    if (npc.data.role) {
                        worldInfo += ` (${npc.data.role})`;
                    }
                    worldInfo += "\\n";
                });
            }

            if (locations.length === 0 && npcs.length === 0) {
                worldInfo += "*No world information available*";
            }

            return worldInfo;
        } catch (error) {
            return "Failed to retrieve world information.";
        }
    }
}