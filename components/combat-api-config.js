/**
 * Combat API Configuration for STRES
 * Allows users to configure fallback APIs for combat mode
 */

export class CombatAPIConfig {
    constructor() {
        this.settings = {
            enabled: false,
            fallbackAPI: {
                provider: 'same', // 'same', 'openai', 'claude', 'local', 'custom'
                endpoint: '',
                apiKey: '',
                model: 'gpt-3.5-turbo',
                maxTokens: 150,
                temperature: 0.7
            },
            contextReduction: {
                enabled: true,
                maxMessages: 3,
                stripWorldInfo: true,
                stripLorebook: true,
                combatToolsOnly: true
            },
            uiEnhancements: {
                showCombatIndicator: true,
                showQuickActions: true,
                showInitiativeTracker: true,
                autoSwitchNotification: true
            }
        };
    }

    /**
     * Render configuration UI
     */
    renderConfigUI() {
        return `
        <div class="stres-combat-config">
            <h3>⚔️ Combat Mode Configuration</h3>
            
            <div class="config-section">
                <label class="checkbox">
                    <input type="checkbox" id="combat-mode-enabled" ${this.settings.enabled ? 'checked' : ''}>
                    <span>Enable Combat Mode Context Switching</span>
                </label>
                <small>Automatically switch to lightweight context during combat for faster responses and lower costs</small>
            </div>

            <div class="config-section" id="combat-api-config" ${!this.settings.enabled ? 'style="display:none"' : ''}>
                <h4>Combat API Settings</h4>
                
                <div class="form-group">
                    <label>Combat API Provider:</label>
                    <select id="combat-api-provider" onchange="window.combatConfig.onProviderChange(this.value)">
                        <option value="same" ${this.settings.fallbackAPI.provider === 'same' ? 'selected' : ''}>
                            Use Same API (with optimized settings)
                        </option>
                        <option value="openai" ${this.settings.fallbackAPI.provider === 'openai' ? 'selected' : ''}>
                            OpenAI (separate API key)
                        </option>
                        <option value="claude" ${this.settings.fallbackAPI.provider === 'claude' ? 'selected' : ''}>
                            Anthropic Claude (separate API key)
                        </option>
                        <option value="local" ${this.settings.fallbackAPI.provider === 'local' ? 'selected' : ''}>
                            Local Model (Ollama/LM Studio)
                        </option>
                        <option value="custom" ${this.settings.fallbackAPI.provider === 'custom' ? 'selected' : ''}>
                            Custom Endpoint
                        </option>
                    </select>
                </div>

                <div id="api-specific-config">
                    ${this.renderProviderConfig()}
                </div>

                <div class="form-group">
                    <label>Combat Model:</label>
                    <select id="combat-model">
                        ${this.getModelOptions()}
                    </select>
                    <small>Recommended: Faster/cheaper models for combat</small>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Max Tokens:</label>
                        <input type="number" id="combat-max-tokens" value="${this.settings.fallbackAPI.maxTokens}" min="50" max="500">
                        <small>150 recommended</small>
                    </div>
                    <div class="form-group">
                        <label>Temperature:</label>
                        <input type="number" id="combat-temperature" value="${this.settings.fallbackAPI.temperature}" min="0" max="1" step="0.1">
                        <small>0.7 for consistency</small>
                    </div>
                </div>
            </div>

            <div class="config-section" ${!this.settings.enabled ? 'style="display:none"' : ''}>
                <h4>Context Optimization</h4>
                
                <label class="checkbox">
                    <input type="checkbox" id="context-reduction" ${this.settings.contextReduction.enabled ? 'checked' : ''}>
                    <span>Enable Context Reduction</span>
                </label>
                
                <div class="form-group">
                    <label>Max Chat Messages in Combat:</label>
                    <input type="number" id="max-combat-messages" value="${this.settings.contextReduction.maxMessages}" min="1" max="10">
                    <small>Only recent messages sent to combat AI</small>
                </div>
                
                <label class="checkbox">
                    <input type="checkbox" id="strip-world-info" ${this.settings.contextReduction.stripWorldInfo ? 'checked' : ''}>
                    <span>Strip World Info in Combat</span>
                </label>
                
                <label class="checkbox">
                    <input type="checkbox" id="strip-lorebook" ${this.settings.contextReduction.stripLorebook ? 'checked' : ''}>
                    <span>Strip Lorebook in Combat</span>
                </label>
                
                <label class="checkbox">
                    <input type="checkbox" id="combat-tools-only" ${this.settings.contextReduction.combatToolsOnly ? 'checked' : ''}>
                    <span>Use Combat Tools Only</span>
                </label>
            </div>

            <div class="config-section" ${!this.settings.enabled ? 'style="display:none"' : ''}>
                <h4>UI Enhancements</h4>
                
                <label class="checkbox">
                    <input type="checkbox" id="show-combat-indicator" ${this.settings.uiEnhancements.showCombatIndicator ? 'checked' : ''}>
                    <span>Show Combat Mode Indicator</span>
                </label>
                
                <label class="checkbox">
                    <input type="checkbox" id="show-quick-actions" ${this.settings.uiEnhancements.showQuickActions ? 'checked' : ''}>
                    <span>Show Quick Action Buttons</span>
                </label>
                
                <label class="checkbox">
                    <input type="checkbox" id="show-initiative-tracker" ${this.settings.uiEnhancements.showInitiativeTracker ? 'checked' : ''}>
                    <span>Show Initiative Tracker</span>
                </label>
                
                <label class="checkbox">
                    <input type="checkbox" id="auto-switch-notification" ${this.settings.uiEnhancements.autoSwitchNotification ? 'checked' : ''}>
                    <span>Notify When Switching to Combat Mode</span>
                </label>
            </div>

            <div class="config-section">
                <h4>Cost Estimation</h4>
                <div id="cost-estimate">
                    ${this.renderCostEstimate()}
                </div>
            </div>

            <div class="config-actions">
                <button onclick="window.combatConfig.testCombatAPI()" class="btn btn-primary">Test Combat API</button>
                <button onclick="window.combatConfig.saveSettings()" class="btn btn-success">Save Settings</button>
                <button onclick="window.combatConfig.resetDefaults()" class="btn btn-secondary">Reset to Defaults</button>
            </div>
        </div>
        `;
    }

    /**
     * Render provider-specific configuration
     */
    renderProviderConfig() {
        switch (this.settings.fallbackAPI.provider) {
            case 'openai':
                return `
                    <div class="form-group">
                        <label>OpenAI API Key:</label>
                        <input type="password" id="combat-api-key" value="${this.settings.fallbackAPI.apiKey}" placeholder="sk-...">
                        <small>Separate key for combat requests (optional)</small>
                    </div>
                    <div class="form-group">
                        <label>Endpoint:</label>
                        <input type="url" id="combat-endpoint" value="${this.settings.fallbackAPI.endpoint || 'https://api.openai.com/v1'}" readonly>
                    </div>
                `;
                
            case 'claude':
                return `
                    <div class="form-group">
                        <label>Anthropic API Key:</label>
                        <input type="password" id="combat-api-key" value="${this.settings.fallbackAPI.apiKey}" placeholder="sk-ant-...">
                    </div>
                    <div class="form-group">
                        <label>Endpoint:</label>
                        <input type="url" id="combat-endpoint" value="${this.settings.fallbackAPI.endpoint || 'https://api.anthropic.com/v1'}" readonly>
                    </div>
                `;
                
            case 'local':
                return `
                    <div class="form-group">
                        <label>Local Endpoint:</label>
                        <input type="url" id="combat-endpoint" value="${this.settings.fallbackAPI.endpoint || 'http://localhost:1234/v1'}" placeholder="http://localhost:1234/v1">
                        <small>Ollama: http://localhost:11434/v1 | LM Studio: http://localhost:1234/v1</small>
                    </div>
                    <div class="form-group">
                        <label>Model Name:</label>
                        <input type="text" id="local-model-name" value="${this.settings.fallbackAPI.model}" placeholder="llama3:8b">
                    </div>
                `;
                
            case 'custom':
                return `
                    <div class="form-group">
                        <label>Custom Endpoint:</label>
                        <input type="url" id="combat-endpoint" value="${this.settings.fallbackAPI.endpoint}" placeholder="https://your-api.com/v1">
                    </div>
                    <div class="form-group">
                        <label>API Key (if required):</label>
                        <input type="password" id="combat-api-key" value="${this.settings.fallbackAPI.apiKey}" placeholder="Optional">
                    </div>
                    <div class="form-group">
                        <label>Request Format:</label>
                        <select id="custom-format">
                            <option value="openai">OpenAI Compatible</option>
                            <option value="claude">Claude Compatible</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                `;
                
            default:
                return '<small>Using the same API endpoint with optimized settings for combat.</small>';
        }
    }

    /**
     * Get model options based on provider
     */
    getModelOptions() {
        const models = {
            same: [],
            openai: ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-turbo'],
            claude: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
            local: ['llama3:8b', 'llama3:13b', 'mistral:7b', 'codellama:7b'],
            custom: []
        };

        const currentProvider = this.settings.fallbackAPI.provider;
        const availableModels = models[currentProvider] || [];

        return availableModels.map(model => 
            `<option value="${model}" ${model === this.settings.fallbackAPI.model ? 'selected' : ''}>${model}</option>`
        ).join('') || '<option>Use Default</option>';
    }

    /**
     * Render cost estimation
     */
    renderCostEstimate() {
        const estimates = this.calculateCostEstimate();
        
        return `
            <div class="cost-comparison">
                <div class="cost-item">
                    <strong>Regular Mode:</strong>
                    <span>~$${estimates.regular.toFixed(4)} per combat turn</span>
                </div>
                <div class="cost-item success">
                    <strong>Combat Mode:</strong>
                    <span>~$${estimates.combat.toFixed(4)} per combat turn</span>
                </div>
                <div class="cost-savings">
                    <strong>Savings:</strong>
                    <span>${estimates.savings}% reduction</span>
                </div>
            </div>
            
            <small>Estimates based on typical combat scenario with ${this.settings.contextReduction.maxMessages} messages</small>
        `;
    }

    /**
     * Calculate cost estimates
     */
    calculateCostEstimate() {
        // Rough token estimates
        const regularTokens = 50000; // Full context
        const combatTokens = 2000;   // Reduced context
        
        // Cost per 1k tokens (rough averages)
        const costs = {
            'gpt-4': 0.03,
            'gpt-3.5-turbo': 0.002,
            'claude-3-opus': 0.015,
            'claude-3-sonnet': 0.003,
            'claude-3-haiku': 0.00025,
            'local': 0
        };
        
        const model = this.settings.fallbackAPI.model;
        const costPer1k = costs[model] || 0.002;
        
        const regularCost = (regularTokens / 1000) * costPer1k;
        const combatCost = (combatTokens / 1000) * costPer1k;
        
        const savings = Math.round((1 - combatCost / regularCost) * 100);
        
        return {
            regular: regularCost,
            combat: combatCost,
            savings: savings
        };
    }

    /**
     * Handle provider selection change
     */
    onProviderChange(provider) {
        this.settings.fallbackAPI.provider = provider;
        
        // Update provider-specific config
        const configDiv = document.querySelector('#api-specific-config');
        if (configDiv) {
            configDiv.innerHTML = this.renderProviderConfig();
        }
        
        // Update model options
        const modelSelect = document.querySelector('#combat-model');
        if (modelSelect) {
            modelSelect.innerHTML = this.getModelOptions();
        }
        
        // Update cost estimate
        const costDiv = document.querySelector('#cost-estimate');
        if (costDiv) {
            costDiv.innerHTML = this.renderCostEstimate();
        }
    }

    /**
     * Test combat API connection
     */
    async testCombatAPI() {
        const testButton = document.querySelector('button[onclick*="testCombatAPI"]');
        if (testButton) {
            testButton.textContent = 'Testing...';
            testButton.disabled = true;
        }
        
        try {
            const testMessage = {
                messages: [{
                    role: 'user',
                    content: 'Test combat API connection'
                }],
                max_tokens: 10,
                temperature: 0.7
            };
            
            const endpoint = this.getCombatEndpoint();
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(testMessage)
            });
            
            if (response.ok) {
                this.showNotification('Combat API Test Successful', 'Connection working properly');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            this.showNotification('Combat API Test Failed', error.message, 'error');
        }
        
        if (testButton) {
            testButton.textContent = 'Test Combat API';
            testButton.disabled = false;
        }
    }

    /**
     * Save configuration
     */
    saveSettings() {
        // Collect form values
        this.settings.enabled = document.querySelector('#combat-mode-enabled')?.checked || false;
        this.settings.fallbackAPI.provider = document.querySelector('#combat-api-provider')?.value || 'same';
        this.settings.fallbackAPI.apiKey = document.querySelector('#combat-api-key')?.value || '';
        this.settings.fallbackAPI.endpoint = document.querySelector('#combat-endpoint')?.value || '';
        this.settings.fallbackAPI.model = document.querySelector('#combat-model')?.value || 'gpt-3.5-turbo';
        this.settings.fallbackAPI.maxTokens = parseInt(document.querySelector('#combat-max-tokens')?.value) || 150;
        this.settings.fallbackAPI.temperature = parseFloat(document.querySelector('#combat-temperature')?.value) || 0.7;
        
        this.settings.contextReduction.enabled = document.querySelector('#context-reduction')?.checked || true;
        this.settings.contextReduction.maxMessages = parseInt(document.querySelector('#max-combat-messages')?.value) || 3;
        this.settings.contextReduction.stripWorldInfo = document.querySelector('#strip-world-info')?.checked || true;
        this.settings.contextReduction.stripLorebook = document.querySelector('#strip-lorebook')?.checked || true;
        this.settings.contextReduction.combatToolsOnly = document.querySelector('#combat-tools-only')?.checked || true;
        
        // Save to extension settings
        if (window.extension_settings) {
            window.extension_settings.stres = window.extension_settings.stres || {};
            window.extension_settings.stres.combatMode = this.settings;
            
            if (window.saveSettingsDebounced) {
                window.saveSettingsDebounced();
            }
        }
        
        this.showNotification('Settings Saved', 'Combat mode configuration updated');
    }

    /**
     * Reset to defaults
     */
    resetDefaults() {
        if (confirm('Reset all combat mode settings to defaults?')) {
            this.settings = this.getDefaultSettings();
            
            // Re-render the form
            const container = document.querySelector('.stres-combat-config');
            if (container) {
                container.innerHTML = this.renderConfigUI();
            }
            
            this.showNotification('Settings Reset', 'All combat settings reset to defaults');
        }
    }

    /**
     * Get combat endpoint based on provider
     */
    getCombatEndpoint() {
        const provider = this.settings.fallbackAPI.provider;
        
        const endpoints = {
            openai: 'https://api.openai.com/v1/chat/completions',
            claude: 'https://api.anthropic.com/v1/messages',
            local: this.settings.fallbackAPI.endpoint + '/chat/completions',
            custom: this.settings.fallbackAPI.endpoint
        };
        
        return endpoints[provider] || window.location.origin;
    }

    /**
     * Get request headers
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.settings.fallbackAPI.apiKey) {
            if (this.settings.fallbackAPI.provider === 'claude') {
                headers['x-api-key'] = this.settings.fallbackAPI.apiKey;
                headers['anthropic-version'] = '2023-06-01';
            } else {
                headers['Authorization'] = `Bearer ${this.settings.fallbackAPI.apiKey}`;
            }
        }
        
        return headers;
    }

    /**
     * Show notification
     */
    showNotification(title, message, type = 'success') {
        // Use SillyTavern's notification system if available
        if (window.toastr) {
            window.toastr[type](message, title);
        } else {
            alert(`${title}: ${message}`);
        }
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            enabled: false,
            fallbackAPI: {
                provider: 'same',
                endpoint: '',
                apiKey: '',
                model: 'gpt-3.5-turbo',
                maxTokens: 150,
                temperature: 0.7
            },
            contextReduction: {
                enabled: true,
                maxMessages: 3,
                stripWorldInfo: true,
                stripLorebook: true,
                combatToolsOnly: true
            },
            uiEnhancements: {
                showCombatIndicator: true,
                showQuickActions: true,
                showInitiativeTracker: true,
                autoSwitchNotification: true
            }
        };
    }
}

// Make globally available
window.CombatAPIConfig = CombatAPIConfig;
window.combatConfig = new CombatAPIConfig();