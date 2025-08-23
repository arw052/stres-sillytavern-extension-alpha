/**
 * Enhanced Character Panel for complex RPG data
 * Supports skills, magic, unique abilities, and world information
 */

export class EnhancedCharacterPanel {
    constructor(client, settings) {
        this.client = client;
        this.settings = settings;
        this.characterData = null;
        this.activeTab = 'stats';
        this.panels = {};
    }

    create() {
        // Create main panel container
        const panel = document.createElement('div');
        panel.id = 'enhanced-character-panel';
        panel.className = 'stres-enhanced-panel';
        panel.innerHTML = this.getEnhancedPanelHTML();

        // Add event listeners
        this.attachEventListeners(panel);

        return panel;
    }

    getEnhancedPanelHTML() {
        return `
            <div class="enhanced-panel-header">
                <h3 id="character-name">Character</h3>
                <div class="character-quick-stats">
                    <div class="stat-bar">
                        <label>HP</label>
                        <div class="bar-container">
                            <div class="bar hp-bar" id="hp-bar"></div>
                            <span class="bar-text" id="hp-text">100/100</span>
                        </div>
                    </div>
                    <div class="stat-bar">
                        <label>MP</label>
                        <div class="bar-container">
                            <div class="bar mp-bar" id="mp-bar"></div>
                            <span class="bar-text" id="mp-text">50/50</span>
                        </div>
                    </div>
                    <div class="stat-bar">
                        <label>Stamina</label>
                        <div class="bar-container">
                            <div class="bar stamina-bar" id="stamina-bar"></div>
                            <span class="bar-text" id="stamina-text">80/80</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="enhanced-panel-tabs">
                <button class="tab-button active" data-tab="stats">Stats</button>
                <button class="tab-button" data-tab="skills">Skills</button>
                <button class="tab-button" data-tab="magic">Magic</button>
                <button class="tab-button" data-tab="inventory">Inventory</button>
                <button class="tab-button" data-tab="world">World</button>
                <button class="tab-button unique-skill-tab" data-tab="unique" style="display: none;">Unique</button>
            </div>

            <div class="enhanced-panel-content">
                <!-- Stats Tab -->
                <div class="tab-content active" id="stats-tab">
                    <div class="character-info">
                        <div class="info-row">
                            <span>Level:</span>
                            <span id="character-level">1</span>
                        </div>
                        <div class="info-row">
                            <span>Race:</span>
                            <span id="character-race">Human</span>
                        </div>
                        <div class="info-row">
                            <span>Class:</span>
                            <span id="character-class">Adventurer</span>
                        </div>
                        <div class="info-row">
                            <span>XP:</span>
                            <span id="character-xp">0</span>
                        </div>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-item">
                            <label>STR</label>
                            <span id="stat-str">10</span>
                            <small id="mod-str">(+0)</small>
                        </div>
                        <div class="stat-item">
                            <label>DEX</label>
                            <span id="stat-dex">10</span>
                            <small id="mod-dex">(+0)</small>
                        </div>
                        <div class="stat-item">
                            <label>CON</label>
                            <span id="stat-con">10</span>
                            <small id="mod-con">(+0)</small>
                        </div>
                        <div class="stat-item">
                            <label>INT</label>
                            <span id="stat-int">10</span>
                            <small id="mod-int">(+0)</small>
                        </div>
                        <div class="stat-item">
                            <label>WIS</label>
                            <span id="stat-wis">10</span>
                            <small id="mod-wis">(+0)</small>
                        </div>
                        <div class="stat-item">
                            <label>CHA</label>
                            <span id="stat-cha">10</span>
                            <small id="mod-cha">(+0)</small>
                        </div>
                        <div class="stat-item luck-stat">
                            <label>LCK</label>
                            <span id="stat-lck">10</span>
                            <small id="mod-lck">(+0)</small>
                        </div>
                    </div>

                    <div class="derived-stats">
                        <div class="derived-stat">
                            <label>Carry Weight:</label>
                            <span id="carry-weight">0/100</span>
                        </div>
                        <div class="derived-stat">
                            <label>Gold:</label>
                            <span id="gold">0g</span>
                        </div>
                    </div>
                </div>

                <!-- Skills Tab -->
                <div class="tab-content" id="skills-tab">
                    <div class="skills-header">
                        <h4>Skills</h4>
                        <button class="skill-action-btn" id="learn-skill-btn">Learn Skill</button>
                    </div>
                    <div class="skills-list" id="skills-list">
                        <!-- Skills will be populated here -->
                    </div>
                </div>

                <!-- Magic Tab -->
                <div class="tab-content" id="magic-tab">
                    <div class="magic-header">
                        <h4>Spells & Magic</h4>
                        <div class="magic-schools" id="magic-schools">
                            <!-- Magic school affinities will be shown here -->
                        </div>
                    </div>
                    <div class="spells-list" id="spells-list">
                        <!-- Spells will be populated here -->
                    </div>
                </div>

                <!-- Inventory Tab -->
                <div class="tab-content" id="inventory-tab">
                    <div class="inventory-header">
                        <h4>Inventory</h4>
                        <div class="inventory-stats">
                            <span>Weight: <span id="inventory-weight">0</span>/<span id="max-weight">100</span></span>
                        </div>
                    </div>
                    <div class="inventory-grid" id="inventory-grid">
                        <!-- Inventory items will be populated here -->
                    </div>
                    <div class="equipped-items">
                        <h5>Equipped</h5>
                        <div class="equipment-slots" id="equipment-slots">
                            <!-- Equipment slots will be shown here -->
                        </div>
                    </div>
                </div>

                <!-- World Tab -->
                <div class="tab-content" id="world-tab">
                    <div class="world-info">
                        <div class="location-info">
                            <h4>Current Location</h4>
                            <div id="current-location">Unknown</div>
                        </div>
                        <div class="known-npcs">
                            <h4>Known NPCs</h4>
                            <div id="npcs-list"></div>
                        </div>
                        <div class="known-locations">
                            <h4>Known Locations</h4>
                            <div id="locations-list"></div>
                        </div>
                        <div class="relationships">
                            <h4>Relationships</h4>
                            <div id="relationships-list"></div>
                        </div>
                    </div>
                </div>

                <!-- Unique Skills Tab (Otherworlder only) -->
                <div class="tab-content" id="unique-tab">
                    <div class="unique-skill-info">
                        <h4>Unique Skill</h4>
                        <div class="unique-skill-card" id="unique-skill-card">
                            <div class="unique-skill-name" id="unique-skill-name">Not Awakened</div>
                            <div class="unique-skill-description" id="unique-skill-description"></div>
                            <div class="unique-skill-evolution">
                                <label>Evolution Stage:</label>
                                <div class="evolution-progress" id="evolution-progress">
                                    <div class="evolution-stage" data-stage="0">Initial</div>
                                    <div class="evolution-stage" data-stage="1">Lvl 10</div>
                                    <div class="evolution-stage" data-stage="2">Lvl 20</div>
                                    <div class="evolution-stage" data-stage="3">Lvl 50</div>
                                    <div class="evolution-stage" data-stage="4">Lvl 100</div>
                                </div>
                            </div>
                        </div>
                        <div class="system-notifications" id="system-notifications">
                            <h5>System Messages</h5>
                            <div id="system-log"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="panel-actions">
                <button id="refresh-character" class="action-btn">Refresh</button>
                <button id="export-character" class="action-btn">Export</button>
                <button id="import-character" class="action-btn">Import</button>
            </div>
        `;
    }

    attachEventListeners(panel) {
        // Tab switching
        const tabButtons = panel.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Action buttons
        panel.querySelector('#refresh-character').addEventListener('click', () => {
            this.refresh();
        });

        panel.querySelector('#export-character').addEventListener('click', () => {
            this.exportCharacter();
        });

        panel.querySelector('#import-character').addEventListener('click', () => {
            this.importCharacter();
        });

        // Skill actions
        panel.querySelector('#learn-skill-btn').addEventListener('click', () => {
            this.showLearnSkillDialog();
        });
    }

    switchTab(tabName) {
        this.activeTab = tabName;

        // Update tab buttons
        const panel = document.getElementById('enhanced-character-panel');
        panel.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        panel.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        panel.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        panel.querySelector(`#${tabName}-tab`).classList.add('active');
    }

    async updateCharacterData(characterData) {
        this.characterData = characterData;

        // Update basic info
        document.getElementById('character-name').textContent = characterData.name || 'Unknown';
        document.getElementById('character-level').textContent = characterData.level || 1;
        document.getElementById('character-race').textContent = characterData.race || 'Human';
        document.getElementById('character-class').textContent = characterData.class || 'Adventurer';
        document.getElementById('character-xp').textContent = characterData.experience || 0;

        // Update stats
        this.updateStats(characterData);

        // Update resource bars
        this.updateResourceBars(characterData);

        // Update tabs based on character data
        this.updateSkills(characterData.skills || []);
        this.updateMagic(characterData.spells || []);
        this.updateInventory(characterData.inventory || []);
        this.updateWorldInfo(characterData.world_info || {});

        // Show unique skill tab if otherworlder
        if (characterData.is_otherworlder) {
            document.querySelector('.unique-skill-tab').style.display = 'block';
            this.updateUniqueSkill(characterData.unique_skill);
        }
    }

    updateStats(characterData) {
        const stats = characterData.stats || {};
        
        ['str', 'dex', 'con', 'int', 'wis', 'cha', 'lck'].forEach(stat => {
            const value = stats[stat.toUpperCase()] || 10;
            const modifier = Math.floor((value - 10) / 2);
            const sign = modifier >= 0 ? '+' : '';
            
            document.getElementById(`stat-${stat}`).textContent = value;
            document.getElementById(`mod-${stat}`).textContent = `(${sign}${modifier})`;
        });

        // Update derived stats
        const carryWeight = characterData.carry_weight_current || 0;
        const maxCarryWeight = characterData.carry_weight_max || 100;
        document.getElementById('carry-weight').textContent = `${carryWeight}/${maxCarryWeight}`;
        document.getElementById('gold').textContent = `${characterData.gold || 0}g`;
    }

    updateResourceBars(characterData) {
        // HP Bar
        const hpCurrent = characterData.hp?.current || characterData.hp_current || 100;
        const hpMax = characterData.hp?.max || characterData.hp_max || 100;
        this.updateBar('hp-bar', 'hp-text', hpCurrent, hpMax);

        // MP Bar
        const mpCurrent = characterData.mp?.current || characterData.mp_current || 50;
        const mpMax = characterData.mp?.max || characterData.mp_max || 50;
        this.updateBar('mp-bar', 'mp-text', mpCurrent, mpMax);

        // Stamina Bar
        const staminaCurrent = characterData.stamina?.current || characterData.stamina_current || 80;
        const staminaMax = characterData.stamina?.max || characterData.stamina_max || 80;
        this.updateBar('stamina-bar', 'stamina-text', staminaCurrent, staminaMax);
    }

    updateBar(barId, textId, current, max) {
        const percentage = max > 0 ? (current / max) * 100 : 0;
        const bar = document.getElementById(barId);
        const text = document.getElementById(textId);
        
        bar.style.width = `${percentage}%`;
        text.textContent = `${current}/${max}`;

        // Color based on percentage
        bar.className = 'bar ';
        if (barId.includes('hp')) bar.className += 'hp-bar';
        else if (barId.includes('mp')) bar.className += 'mp-bar';
        else if (barId.includes('stamina')) bar.className += 'stamina-bar';

        if (percentage <= 25) bar.classList.add('critical');
        else if (percentage <= 50) bar.classList.add('warning');
    }

    updateSkills(skills) {
        const skillsList = document.getElementById('skills-list');
        skillsList.innerHTML = '';

        if (!skills || skills.length === 0) {
            skillsList.innerHTML = '<div class="no-skills">No skills learned yet</div>';
            return;
        }

        skills.forEach(skill => {
            const skillElement = document.createElement('div');
            skillElement.className = 'skill-item';
            skillElement.innerHTML = `
                <div class="skill-header">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-rank ${skill.rank || 'novice'}">${(skill.rank || 'novice').toUpperCase()}</span>
                </div>
                <div class="skill-details">
                    <div class="skill-category">${skill.category || 'General'}</div>
                    <div class="skill-progress">
                        <div class="xp-bar">
                            <div class="xp-fill" style="width: ${this.calculateSkillProgress(skill)}%"></div>
                        </div>
                        <span class="xp-text">${skill.experience || 0} XP</span>
                    </div>
                    <div class="skill-uses">Used: ${skill.uses || 0} times</div>
                </div>
            `;

            // Add click handler for skill actions
            skillElement.addEventListener('click', () => {
                this.showSkillActions(skill);
            });

            skillsList.appendChild(skillElement);
        });
    }

    updateMagic(spells) {
        const spellsList = document.getElementById('spells-list');
        spellsList.innerHTML = '';

        if (!spells || spells.length === 0) {
            spellsList.innerHTML = '<div class="no-spells">No spells known</div>';
            return;
        }

        // Group spells by school
        const spellsBySchool = {};
        spells.forEach(spell => {
            const school = spell.school || 'Arcane';
            if (!spellsBySchool[school]) {
                spellsBySchool[school] = [];
            }
            spellsBySchool[school].push(spell);
        });

        Object.entries(spellsBySchool).forEach(([school, schoolSpells]) => {
            const schoolElement = document.createElement('div');
            schoolElement.className = 'magic-school-group';
            schoolElement.innerHTML = `
                <h5 class="school-header ${school.toLowerCase()}">${school} Magic</h5>
                <div class="school-spells">
                    ${schoolSpells.map(spell => `
                        <div class="spell-item" data-spell="${spell.name}">
                            <div class="spell-header">
                                <span class="spell-name">${spell.name}</span>
                                <span class="spell-tier">Tier ${spell.tier || 1}</span>
                            </div>
                            <div class="spell-details">
                                <span class="mp-cost">${spell.mp_cost || 5} MP</span>
                                <span class="mastery">${spell.mastery || 'Novice'} Mastery</span>
                                <span class="cast-count">Cast: ${spell.times_cast || 0}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            spellsList.appendChild(schoolElement);
        });
    }

    updateInventory(inventory) {
        const inventoryGrid = document.getElementById('inventory-grid');
        inventoryGrid.innerHTML = '';

        if (!inventory || inventory.length === 0) {
            inventoryGrid.innerHTML = '<div class="no-items">Empty inventory</div>';
            return;
        }

        inventory.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.innerHTML = `
                <div class="item-name">${item.name || item.item || 'Unknown Item'}</div>
                <div class="item-quantity">${item.quantity || 1}</div>
                <div class="item-description">${item.description || ''}</div>
            `;
            inventoryGrid.appendChild(itemElement);
        });
    }

    updateWorldInfo(worldInfo) {
        // Update current location
        document.getElementById('current-location').textContent = 
            worldInfo.current_location || this.characterData?.location || 'Unknown';

        // Update known NPCs
        const npcsList = document.getElementById('npcs-list');
        npcsList.innerHTML = '';
        if (worldInfo.npcs) {
            worldInfo.npcs.forEach(npc => {
                const npcElement = document.createElement('div');
                npcElement.className = 'npc-item';
                npcElement.innerHTML = `
                    <span class="npc-name">${npc.name}</span>
                    <span class="npc-relationship">${npc.relationship || 'Neutral'}</span>
                `;
                npcsList.appendChild(npcElement);
            });
        }

        // Update known locations
        const locationsList = document.getElementById('locations-list');
        locationsList.innerHTML = '';
        if (worldInfo.locations) {
            worldInfo.locations.forEach(location => {
                const locationElement = document.createElement('div');
                locationElement.className = 'location-item';
                locationElement.textContent = location.name || location;
                locationsList.appendChild(locationElement);
            });
        }
    }

    updateUniqueSkill(uniqueSkill) {
        if (!uniqueSkill) return;

        document.getElementById('unique-skill-name').textContent = 
            uniqueSkill.name || 'Not Awakened';
        document.getElementById('unique-skill-description').textContent = 
            uniqueSkill.description || '';

        // Update evolution progress
        const evolutionStages = document.querySelectorAll('.evolution-stage');
        evolutionStages.forEach((stage, index) => {
            stage.classList.remove('active', 'completed');
            if (index < (uniqueSkill.evolution || 0)) {
                stage.classList.add('completed');
            } else if (index === (uniqueSkill.evolution || 0)) {
                stage.classList.add('active');
            }
        });
    }

    calculateSkillProgress(skill) {
        const xp = skill.experience || 0;
        const thresholds = [10, 25, 50, 100, 200, 500];
        const rank = skill.rank || 'novice';
        const ranks = ['novice', 'initiate', 'apprentice', 'journeyman', 'adept', 'master', 'grandmaster'];
        
        const currentRankIndex = ranks.indexOf(rank.toLowerCase());
        if (currentRankIndex === -1 || currentRankIndex >= thresholds.length) return 100;
        
        const currentThreshold = currentRankIndex === 0 ? 0 : thresholds[currentRankIndex - 1];
        const nextThreshold = thresholds[currentRankIndex];
        
        const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
        return Math.min(100, Math.max(0, progress));
    }

    async refresh() {
        if (!this.characterData) return;
        
        try {
            // Refresh character data from server
            const response = await this.client.getCharacter(this.characterData.id);
            if (response.success) {
                await this.updateCharacterData(response.character);
            }
        } catch (error) {
            console.error('Failed to refresh character data:', error);
        }
    }

    async exportCharacter() {
        if (!this.characterData) {
            this.showToast('No character data to export', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.client.baseUrl}/api/enhanced/character/${this.characterData.id}/export`);
            const result = await response.json();
            
            if (result.success) {
                // Create download
                const blob = new Blob([JSON.stringify(result.card, null, 2)], 
                    { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${this.characterData.name || 'character'}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                this.showToast('Character exported successfully!', 'success');
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Export failed', 'error');
        }
    }

    async importCharacter() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const cardData = JSON.parse(text);
                
                // Import via API
                const response = await fetch(`${this.client.baseUrl}/api/enhanced/character/import`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        card_data: cardData,
                        campaign_id: this.client.currentCampaignId
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    this.showToast(`Imported ${result.character_name}!`, 'success');
                    this.refresh();
                } else {
                    this.showToast('Import failed: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('Import failed:', error);
                this.showToast('Import failed', 'error');
            }
        });
        
        input.click();
    }

    showSkillActions(skill) {
        // Show skill training/usage options
        console.log('Skill actions for:', skill);
        // TODO: Implement skill action dialog
    }

    showLearnSkillDialog() {
        // Show dialog for learning new skills
        console.log('Learn skill dialog');
        // TODO: Implement learn skill dialog
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `stres-toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}