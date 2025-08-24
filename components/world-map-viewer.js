/**
 * World Map Viewer Component for STRES
 * Integrates Fantasy Map Generator data with SillyTavern
 */

export class WorldMapViewer {
    constructor(client, settings) {
        this.client = client;
        this.settings = settings;
        this.mapData = null;
        this.svgContent = null;
        this.currentLocation = null;
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.markers = new Map();
    }

    /**
     * Load map data from FMG JSON export
     */
    async loadMapData(jsonData) {
        try {
            this.mapData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            // Extract key map features
            this.burgs = this.mapData.pack?.cells?.filter(c => c.burg) || [];
            this.routes = this.mapData.pack?.routes || [];
            this.provinces = this.mapData.pack?.provinces || [];
            this.states = this.mapData.pack?.states || [];
            this.cultures = this.mapData.pack?.cultures || [];
            
            // Build location index for fast lookup
            this.locationIndex = new Map();
            this.burgs.forEach(burg => {
                if (burg.name) {
                    this.locationIndex.set(burg.name.toLowerCase(), burg);
                }
            });
            
            console.log(`[WorldMap] Loaded map with ${this.burgs.length} settlements`);
            return true;
        } catch (error) {
            console.error('[WorldMap] Failed to load map data:', error);
            return false;
        }
    }

    /**
     * Load SVG map for visual display
     */
    async loadSVG(svgContent) {
        this.svgContent = svgContent;
        return true;
    }

    /**
     * Find location by name
     */
    findLocation(locationName) {
        if (!locationName || !this.mapData) return null;
        
        const normalized = locationName.toLowerCase().trim();
        
        // Check exact match first
        if (this.locationIndex.has(normalized)) {
            return this.locationIndex.get(normalized);
        }
        
        // Try partial match
        for (const [name, burg] of this.locationIndex) {
            if (name.includes(normalized) || normalized.includes(name)) {
                return burg;
            }
        }
        
        return null;
    }

    /**
     * Get detailed location information for context injection
     */
    getLocationContext(locationName) {
        const location = this.findLocation(locationName);
        if (!location) return null;
        
        const context = {
            name: location.name,
            coordinates: location.p ? { x: location.p[0], y: location.p[1] } : null,
            population: location.pop || 0,
            elevation: location.h || 0,
            biome: this.getBiomeName(location.biome),
            culture: this.getCultureName(location.culture),
            state: this.getStateName(location.state),
            province: this.getProvinceName(location.province),
            religion: this.getReligionName(location.religion),
            nearby: this.findNearbyLocations(location, 5)
        };
        
        // Generate descriptive text
        context.description = this.generateLocationDescription(context);
        
        return context;
    }

    /**
     * Generate human-readable location description
     */
    generateLocationDescription(context) {
        const parts = [];
        
        if (context.population > 0) {
            const popCategory = context.population < 1000 ? 'small village' :
                               context.population < 5000 ? 'town' :
                               context.population < 20000 ? 'city' : 'major city';
            parts.push(`a ${popCategory} (pop. ${Math.round(context.population * 1000)})`);
        }
        
        if (context.culture) {
            parts.push(`${context.culture} culture`);
        }
        
        if (context.biome) {
            parts.push(`located in ${context.biome}`);
        }
        
        if (context.state && context.province) {
            parts.push(`in ${context.province} province of ${context.state}`);
        }
        
        if (context.nearby.length > 0) {
            parts.push(`near ${context.nearby.slice(0, 3).join(', ')}`);
        }
        
        return parts.join(', ');
    }

    /**
     * Find nearby locations
     */
    findNearbyLocations(location, count = 5) {
        if (!location.p) return [];
        
        const [x, y] = location.p;
        const nearby = [];
        
        for (const burg of this.burgs) {
            if (burg.i === location.i || !burg.p || !burg.name) continue;
            
            const [bx, by] = burg.p;
            const distance = Math.sqrt((x - bx) ** 2 + (y - by) ** 2);
            
            nearby.push({ name: burg.name, distance });
        }
        
        return nearby
            .sort((a, b) => a.distance - b.distance)
            .slice(0, count)
            .map(n => n.name);
    }

    /**
     * Calculate travel route between locations
     */
    calculateRoute(fromName, toName) {
        const from = this.findLocation(fromName);
        const to = this.findLocation(toName);
        
        if (!from || !to || !from.p || !to.p) return null;
        
        const [x1, y1] = from.p;
        const [x2, y2] = to.p;
        
        // Calculate direct distance
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        
        // Estimate travel time based on terrain (simplified)
        const baseSpeed = 30; // km per day on road
        const terrainMultiplier = 1.5; // rough terrain factor
        const travelDays = Math.ceil((distance * this.settings.distanceScale) / baseSpeed * terrainMultiplier);
        
        return {
            from: from.name,
            to: to.name,
            distance: Math.round(distance * this.settings.distanceScale),
            estimatedDays: travelDays,
            waypoints: this.findWaypoints(from, to)
        };
    }

    /**
     * Find waypoints along route
     */
    findWaypoints(from, to) {
        const waypoints = [];
        const [x1, y1] = from.p;
        const [x2, y2] = to.p;
        
        // Find settlements along the route
        for (const burg of this.burgs) {
            if (!burg.p || !burg.name || burg.i === from.i || burg.i === to.i) continue;
            
            const [bx, by] = burg.p;
            
            // Check if burg is roughly along the line between from and to
            const crossProduct = Math.abs((y2 - y1) * bx - (x2 - x1) * by + x2 * y1 - y2 * x1);
            const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const distanceFromLine = crossProduct / lineLength;
            
            if (distanceFromLine < 50) { // Within 50 units of the route
                const progressAlongRoute = ((bx - x1) * (x2 - x1) + (by - y1) * (y2 - y1)) / (lineLength ** 2);
                
                if (progressAlongRoute > 0 && progressAlongRoute < 1) {
                    waypoints.push({
                        name: burg.name,
                        progress: progressAlongRoute
                    });
                }
            }
        }
        
        return waypoints
            .sort((a, b) => a.progress - b.progress)
            .map(w => w.name);
    }

    /**
     * Update character location on map
     */
    updateCharacterLocation(locationName) {
        const location = this.findLocation(locationName);
        
        if (location) {
            this.currentLocation = location;
            this.centerMapOnLocation(location);
            this.highlightLocation(location);
            
            // Trigger location-based events
            this.triggerLocationEvents(location);
        }
        
        return location;
    }

    /**
     * Render map visualization
     */
    render(container) {
        const mapContainer = document.createElement('div');
        mapContainer.id = 'stres-world-map';
        mapContainer.className = 'stres-map-container';
        
        // Add controls
        const controls = this.createMapControls();
        mapContainer.appendChild(controls);
        
        // Add map viewport
        const viewport = document.createElement('div');
        viewport.className = 'stres-map-viewport';
        
        if (this.svgContent) {
            viewport.innerHTML = this.svgContent;
            this.initializeMapInteraction(viewport);
        } else {
            viewport.innerHTML = '<div class="stres-map-placeholder">No map loaded</div>';
        }
        
        mapContainer.appendChild(viewport);
        
        // Add location info panel
        const infoPanel = this.createInfoPanel();
        mapContainer.appendChild(infoPanel);
        
        container.appendChild(mapContainer);
        this.container = mapContainer;
    }

    /**
     * Create map control buttons
     */
    createMapControls() {
        const controls = document.createElement('div');
        controls.className = 'stres-map-controls';
        
        controls.innerHTML = `
            <button class="stres-map-btn" data-action="zoom-in">+</button>
            <button class="stres-map-btn" data-action="zoom-out">-</button>
            <button class="stres-map-btn" data-action="reset">⟲</button>
            <button class="stres-map-btn" data-action="toggle-labels">📍</button>
        `;
        
        controls.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) this.handleControlAction(action);
        });
        
        return controls;
    }

    /**
     * Create location information panel
     */
    createInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'stres-map-info';
        panel.id = 'stres-map-info';
        
        panel.innerHTML = `
            <h4>Location Info</h4>
            <div id="stres-location-details">
                <p>Click on a location for details</p>
            </div>
        `;
        
        return panel;
    }

    /**
     * Initialize map pan and zoom
     */
    initializeMapInteraction(viewport) {
        const svg = viewport.querySelector('svg');
        if (!svg) return;
        
        let isPanning = false;
        let startX = 0;
        let startY = 0;
        
        svg.addEventListener('mousedown', (e) => {
            isPanning = true;
            startX = e.clientX - this.panX;
            startY = e.clientY - this.panY;
            svg.style.cursor = 'grabbing';
        });
        
        svg.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            
            this.panX = e.clientX - startX;
            this.panY = e.clientY - startY;
            this.updateTransform(svg);
        });
        
        svg.addEventListener('mouseup', () => {
            isPanning = false;
            svg.style.cursor = 'grab';
        });
        
        svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.scale *= delta;
            this.scale = Math.max(0.5, Math.min(5, this.scale));
            this.updateTransform(svg);
        });
        
        // Add click handlers for locations
        this.addLocationClickHandlers(svg);
    }

    /**
     * Add click handlers for map locations
     */
    addLocationClickHandlers(svg) {
        // Find burg elements in SVG
        const burgElements = svg.querySelectorAll('.burg, circle[data-id]');
        
        burgElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                const burgId = element.dataset.id;
                const burg = this.burgs.find(b => b.i == burgId);
                
                if (burg) {
                    this.showLocationInfo(burg);
                }
            });
        });
    }

    /**
     * Display location information
     */
    showLocationInfo(location) {
        const panel = document.getElementById('stres-location-details');
        if (!panel) return;
        
        const context = this.getLocationContext(location.name);
        
        panel.innerHTML = `
            <h5>${location.name}</h5>
            <p>${context.description}</p>
            <div class="stres-location-stats">
                ${context.population > 0 ? `<div>Population: ${Math.round(context.population * 1000)}</div>` : ''}
                ${context.biome ? `<div>Terrain: ${context.biome}</div>` : ''}
                ${context.state ? `<div>Nation: ${context.state}</div>` : ''}
                ${context.culture ? `<div>Culture: ${context.culture}</div>` : ''}
            </div>
            <button class="stres-map-btn" onclick="window.stresMapViewer.travelTo('${location.name}')">
                Travel Here
            </button>
        `;
    }

    /**
     * Update SVG transform for pan and zoom
     */
    updateTransform(svg) {
        const g = svg.querySelector('g') || svg;
        g.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    }

    /**
     * Center map on location
     */
    centerMapOnLocation(location) {
        if (!location.p || !this.container) return;
        
        const [x, y] = location.p;
        const viewport = this.container.querySelector('.stres-map-viewport');
        const svg = viewport?.querySelector('svg');
        
        if (svg) {
            const rect = svg.getBoundingClientRect();
            this.panX = rect.width / 2 - x * this.scale;
            this.panY = rect.height / 2 - y * this.scale;
            this.updateTransform(svg);
        }
    }

    /**
     * Highlight current location
     */
    highlightLocation(location) {
        // Remove previous highlight
        const oldHighlight = this.container?.querySelector('.stres-location-highlight');
        if (oldHighlight) oldHighlight.remove();
        
        if (!location.p) return;
        
        const [x, y] = location.p;
        const svg = this.container?.querySelector('svg');
        
        if (svg) {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            marker.setAttribute('cx', x);
            marker.setAttribute('cy', y);
            marker.setAttribute('r', '10');
            marker.setAttribute('class', 'stres-location-highlight');
            marker.style.fill = 'red';
            marker.style.stroke = 'white';
            marker.style.strokeWidth = '2';
            marker.style.animation = 'pulse 2s infinite';
            
            svg.appendChild(marker);
        }
    }

    /**
     * Trigger location-based events
     */
    triggerLocationEvents(location) {
        // Check for special location types
        if (location.port) {
            this.client.triggerEvent('location.port', location);
        }
        
        if (location.capital) {
            this.client.triggerEvent('location.capital', location);
        }
        
        // Check biome-specific events
        const biomeEvents = {
            1: 'location.ocean',
            2: 'location.lake', 
            3: 'location.forest',
            4: 'location.desert',
            5: 'location.mountain',
            6: 'location.wetland',
            7: 'location.grassland'
        };
        
        if (biomeEvents[location.biome]) {
            this.client.triggerEvent(biomeEvents[location.biome], location);
        }
    }

    /**
     * Handle control button actions
     */
    handleControlAction(action) {
        const svg = this.container?.querySelector('svg');
        if (!svg) return;
        
        switch (action) {
            case 'zoom-in':
                this.scale *= 1.2;
                this.scale = Math.min(5, this.scale);
                this.updateTransform(svg);
                break;
                
            case 'zoom-out':
                this.scale *= 0.8;
                this.scale = Math.max(0.5, this.scale);
                this.updateTransform(svg);
                break;
                
            case 'reset':
                this.scale = 1;
                this.panX = 0;
                this.panY = 0;
                this.updateTransform(svg);
                break;
                
            case 'toggle-labels':
                svg.classList.toggle('show-labels');
                break;
        }
    }

    /**
     * Get biome name from ID
     */
    getBiomeName(biomeId) {
        const biomes = {
            0: 'ocean',
            1: 'lake',
            2: 'river',
            3: 'forest',
            4: 'desert',
            5: 'mountains',
            6: 'wetland',
            7: 'grassland',
            8: 'tundra',
            9: 'glacier'
        };
        return biomes[biomeId] || 'unknown';
    }

    /**
     * Get culture name from ID
     */
    getCultureName(cultureId) {
        if (!this.mapData?.pack?.cultures) return null;
        const culture = this.mapData.pack.cultures.find(c => c.i === cultureId);
        return culture?.name || null;
    }

    /**
     * Get state name from ID
     */
    getStateName(stateId) {
        if (!this.mapData?.pack?.states) return null;
        const state = this.mapData.pack.states.find(s => s.i === stateId);
        return state?.name || null;
    }

    /**
     * Get province name from ID
     */
    getProvinceName(provinceId) {
        if (!this.mapData?.pack?.provinces) return null;
        const province = this.mapData.pack.provinces.find(p => p.i === provinceId);
        return province?.name || null;
    }

    /**
     * Get religion name from ID
     */
    getReligionName(religionId) {
        if (!this.mapData?.pack?.religions) return null;
        const religion = this.mapData.pack.religions.find(r => r.i === religionId);
        return religion?.name || null;
    }

    /**
     * Export location data for LLM tools
     */
    exportForLLM() {
        return {
            currentLocation: this.currentLocation?.name,
            availableLocations: Array.from(this.locationIndex.keys()),
            mapBounds: {
                width: this.mapData?.info?.width,
                height: this.mapData?.info?.height
            },
            settings: {
                distanceUnit: this.mapData?.settings?.distanceUnit,
                distanceScale: this.mapData?.settings?.distanceScale
            }
        };
    }
}

// Make available globally for testing
window.WorldMapViewer = WorldMapViewer;