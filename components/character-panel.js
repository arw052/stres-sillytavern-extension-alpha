export class CharacterPanel {
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

        const itemCount = data.inventory.reduce((sum, item) => sum + (item.quantity || 1), 0);
        inventoryDiv.innerHTML = `
            <div class="stres-inventory-summary">
                Items: ${itemCount}
            </div>
        `;

        locationDiv.innerHTML = `
            <div class="stres-location">
                <span class="icon">📍</span>
                <span>${data.location}</span>
            </div>
        `;
    }
}