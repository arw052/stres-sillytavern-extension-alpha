export class AutoInjector {
    constructor(client, settings) {
        this.client = client;
        this.settings = settings;
        this.character = null;
    }

    setCharacter(character) {
        this.character = character;
    }

    injectContext(messageData) {
        if (!this.settings.autoInjection.enabled || !this.character) {
            return;
        }

        const injection = this.generateInjection();
        if (injection) {
            messageData.message = `${injection}\\n\\n${messageData.message}`;
        }
    }

    generateInjection() {
        if (!this.character || !this.character.data) return '';

        const data = this.character.data;
        
        if (this.settings.autoInjection.mode === 'basic') {
            return `[Status] HP: ${data.stats.hp.current}/${data.stats.hp.max} | MP: ${data.stats.mp.current}/${data.stats.mp.max} | Location: ${data.location} | Gold: ${data.gold}g`;
        } else if (this.settings.autoInjection.mode === 'detailed') {
            const items = data.inventory.map(i => `${i.item}${i.quantity > 1 ? ` x${i.quantity}` : ''}`).slice(0, 3).join(', ');
            return `[Character Status]
HP: ${data.stats.hp.current}/${data.stats.hp.max} | MP: ${data.stats.mp.current}/${data.stats.mp.max} | STR: ${data.stats.strength} | DEX: ${data.stats.dexterity} | INT: ${data.stats.intelligence}
Location: ${data.location} | Gold: ${data.gold}g
Notable Items: ${items || 'None'}
Active Effects: None`;
        }
        
        return '';
    }
}