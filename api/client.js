export class STRESClient {
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
        return this.request('/campaigns');
    }

    async getCampaign(campaignId) {
        return this.request(`/campaigns/${campaignId}`);
    }

    async createCampaign(campaign) {
        return this.request('/campaigns', {
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
        return this.request(`/characters/${campaignId}`);
    }

    async getCharacter(campaignId, characterId) {
        return this.request(`/characters/${campaignId}/${characterId}`);
    }

    async createCharacter(character) {
        return this.request('/characters', {
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

    async getWorldStates(campaignId, type = null) {
        const query = type ? `?state_type=${type}` : '';
        return this.request(`/world/${campaignId}${query}`);
    }

    async createWorldState(worldState) {
        return this.request('/world', {
            method: 'POST',
            body: JSON.stringify(worldState)
        });
    }

    async generateName(campaignId, culture = 'human', role = 'commoner', gender = null) {
        return this.request('/names/generate', {
            method: 'POST',
            body: JSON.stringify({
                campaign_id: campaignId,
                culture,
                role,
                gender
            })
        });
    }

    async getNameRegistry(campaignId) {
        return this.request(`/names/registry/${campaignId}`);
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

    async executeBatchTools(toolCalls) {
        return this.request('/tools/batch', {
            method: 'POST',
            body: JSON.stringify(toolCalls)
        });
    }

    // Quick tool access methods
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

    async updateCharacterStats(campaignId, statChanges, reason = 'Manual update') {
        return this.executeTool('update_character_stats', {
            campaign_id: campaignId,
            stat_changes: statChanges,
            reason
        });
    }

    async rollDice(expression, options = {}) {
        return this.executeTool('roll_dice', {
            dice_expression: expression,
            ...options
        });
    }

    async queryWorldState(campaignId, queryType = 'all', options = {}) {
        return this.executeTool('query_world_state', {
            campaign_id: campaignId,
            query_type: queryType,
            ...options
        });
    }
}