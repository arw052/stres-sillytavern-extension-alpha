/**
 * Map-Aware Auto Injector for STRES
 * Enhances context injection with map location data
 */

export class MapAutoInjector {
    constructor(worldMapViewer, settings) {
        this.mapViewer = worldMapViewer;
        this.settings = settings;
        this.lastLocation = null;
        this.travelMode = false;
        this.travelRoute = null;
    }

    /**
     * Generate location-aware context injection
     */
    generateMapContext(character) {
        if (!this.mapViewer.mapData || !character?.data?.location) {
            return '';
        }

        const locationContext = this.mapViewer.getLocationContext(character.data.location);
        
        if (!locationContext) {
            return `[Location: ${character.data.location} (unmapped)]`;
        }

        // Build context based on injection mode
        if (this.settings.mapInjection?.mode === 'detailed') {
            return this.generateDetailedContext(locationContext, character);
        } else if (this.settings.mapInjection?.mode === 'travel') {
            return this.generateTravelContext(locationContext, character);
        } else {
            return this.generateBasicContext(locationContext, character);
        }
    }

    /**
     * Generate basic location context
     */
    generateBasicContext(location, character) {
        const parts = [`[Location: ${location.name}`];
        
        if (location.state) {
            parts.push(`in ${location.state}`);
        }
        
        if (location.biome) {
            parts.push(`(${location.biome})`);
        }
        
        parts.push(']');
        
        return parts.join(' ');
    }

    /**
     * Generate detailed location context
     */
    generateDetailedContext(location, character) {
        const lines = [
            `[Current Location: ${location.name}]`,
            `Region: ${location.province || 'Unknown'}, ${location.state || 'Uncharted Territory'}`,
            `Terrain: ${location.biome || 'varied'} (elevation: ${location.elevation || 0}ft)`,
            `Culture: ${location.culture || 'mixed'}`,
            `Population: ${location.population > 0 ? Math.round(location.population * 1000).toLocaleString() : 'uninhabited'}`
        ];

        if (location.nearby.length > 0) {
            lines.push(`Nearby: ${location.nearby.slice(0, 3).join(', ')}`);
        }

        // Add weather based on biome and elevation
        const weather = this.generateWeather(location);
        if (weather) {
            lines.push(`Weather: ${weather}`);
        }

        // Add regional events or rumors
        const regionalInfo = this.getRegionalInfo(location);
        if (regionalInfo) {
            lines.push(`Local: ${regionalInfo}`);
        }

        return lines.join('\n');
    }

    /**
     * Generate travel-specific context
     */
    generateTravelContext(location, character) {
        if (!this.travelRoute) {
            return this.generateBasicContext(location, character);
        }

        const progress = this.calculateTravelProgress();
        const lines = [
            `[Traveling: ${this.travelRoute.from} → ${this.travelRoute.to}]`,
            `Current Position: ${location.name || 'On the road'}`,
            `Distance Remaining: ${this.travelRoute.distance - progress.distanceTraveled}km`,
            `Days Remaining: ${this.travelRoute.estimatedDays - progress.daysTraveled}`,
            `Terrain: ${location.biome || 'varied'}`
        ];

        if (this.travelRoute.waypoints.length > 0) {
            const nextWaypoint = this.getNextWaypoint(progress);
            if (nextWaypoint) {
                lines.push(`Next Stop: ${nextWaypoint}`);
            }
        }

        // Add travel encounters
        const encounter = this.checkTravelEncounter(location, progress);
        if (encounter) {
            lines.push(`[${encounter}]`);
        }

        return lines.join('\n');
    }

    /**
     * Generate weather based on location
     */
    generateWeather(location) {
        const biomeWeather = {
            'ocean': ['calm seas', 'choppy waters', 'sea breeze', 'fog'],
            'lake': ['still waters', 'light rain', 'morning mist'],
            'forest': ['dappled sunlight', 'light rain', 'cool shade', 'morning dew'],
            'desert': ['scorching sun', 'dry heat', 'sandstorm brewing', 'cool night'],
            'mountains': ['thin air', 'cold winds', 'snow flurries', 'clear skies'],
            'wetland': ['humid', 'misty', 'light drizzle', 'mosquitoes buzzing'],
            'grassland': ['gentle breeze', 'warm sun', 'scattered clouds', 'clear skies'],
            'tundra': ['bitter cold', 'snow', 'harsh winds', 'aurora borealis'],
            'glacier': ['extreme cold', 'blizzard', 'ice crystals in air']
        };

        const weatherOptions = biomeWeather[location.biome] || ['mild weather'];
        
        // Add elevation modifiers
        if (location.elevation > 100) {
            weatherOptions.push('thin air', 'cold');
        }
        
        // Random selection (seeded by location for consistency)
        const seed = location.name.length + location.elevation;
        const index = seed % weatherOptions.length;
        
        return weatherOptions[index];
    }

    /**
     * Get regional information and rumors
     */
    getRegionalInfo(location) {
        const info = [];

        // Culture-specific information
        if (location.culture) {
            const cultureInfo = {
                'Elladian': 'Ancient ruins dot the landscape',
                'Norgen': 'Viking longships patrol the waters',
                'Araban': 'Spice merchants travel the roads',
                'Sheng': 'Paper lanterns light the streets',
                'Ruthenian': 'Orthodox churches mark each village'
            };
            
            if (cultureInfo[location.culture]) {
                info.push(cultureInfo[location.culture]);
            }
        }

        // State-specific events
        if (location.state) {
            // Check for wars, alliances, etc.
            const stateEvents = this.getStateEvents(location.state);
            if (stateEvents) {
                info.push(stateEvents);
            }
        }

        // Population-based activity
        if (location.population > 10) {
            info.push('Bustling with activity');
        } else if (location.population > 5) {
            info.push('Moderate foot traffic');
        } else if (location.population > 0) {
            info.push('Quiet settlement');
        }

        return info.length > 0 ? info[0] : null;
    }

    /**
     * Get state-specific events
     */
    getStateEvents(stateName) {
        // This would be expanded with actual game state
        const events = {
            'war': `${stateName} is at war`,
            'festival': `${stateName} celebrates harvest festival`,
            'plague': `${stateName} suffers from plague`,
            'prosperity': `${stateName} enjoys economic boom`
        };

        // For now, return based on state name length (deterministic)
        const eventKeys = Object.keys(events);
        const index = stateName.length % eventKeys.length;
        
        return events[eventKeys[index]];
    }

    /**
     * Initialize travel between locations
     */
    startTravel(from, to) {
        this.travelRoute = this.mapViewer.calculateRoute(from, to);
        this.travelMode = true;
        this.travelStartTime = Date.now();
        
        return this.travelRoute;
    }

    /**
     * Calculate travel progress
     */
    calculateTravelProgress() {
        if (!this.travelRoute || !this.travelStartTime) {
            return { distanceTraveled: 0, daysTraveled: 0 };
        }

        // Calculate based on real time or turn count
        const elapsedMs = Date.now() - this.travelStartTime;
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        
        // Assume 1 real hour = 1 game day
        const daysTraveled = Math.floor(elapsedHours);
        const progress = daysTraveled / this.travelRoute.estimatedDays;
        const distanceTraveled = Math.floor(this.travelRoute.distance * progress);

        return { distanceTraveled, daysTraveled, progress };
    }

    /**
     * Get next waypoint on route
     */
    getNextWaypoint(progress) {
        if (!this.travelRoute?.waypoints) return null;

        const waypointProgress = 1 / (this.travelRoute.waypoints.length + 1);
        const currentIndex = Math.floor(progress.progress / waypointProgress);
        
        return this.travelRoute.waypoints[currentIndex] || this.travelRoute.to;
    }

    /**
     * Check for travel encounters
     */
    checkTravelEncounter(location, progress) {
        // Encounter chance based on terrain
        const encounterChance = {
            'forest': 0.3,
            'mountains': 0.4,
            'desert': 0.35,
            'wetland': 0.25,
            'grassland': 0.2,
            'tundra': 0.45
        };

        const chance = encounterChance[location.biome] || 0.1;
        
        // Use progress as seed for deterministic encounters
        const seed = Math.floor(progress.daysTraveled);
        const random = this.seededRandom(seed);
        
        if (random < chance) {
            return this.generateEncounter(location.biome, seed);
        }

        return null;
    }

    /**
     * Generate encounter based on terrain
     */
    generateEncounter(biome, seed) {
        const encounters = {
            'forest': ['Bandits block the path', 'A merchant caravan passes by', 'Wild animals rustle in the brush'],
            'mountains': ['Rockslide ahead', 'Mountain goats watch from above', 'An old hermit offers shelter'],
            'desert': ['Sandstorm approaching', 'An oasis appears', 'Desert nomads approach'],
            'wetland': ['The path is flooded', 'Strange lights in the marsh', 'A fisherman offers a ride'],
            'grassland': ['Wild horses gallop past', 'A patrol approaches', 'Storm clouds gather'],
            'tundra': ['Blizzard forces shelter', 'Ice bridge looks unstable', 'Northern lights dance overhead']
        };

        const biomeEncounters = encounters[biome] || ['Something stirs'];
        const index = seed % biomeEncounters.length;
        
        return `Encounter: ${biomeEncounters[index]}`;
    }

    /**
     * Seeded random number generator
     */
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Update character location
     */
    updateLocation(locationName) {
        this.lastLocation = this.mapViewer.updateCharacterLocation(locationName);
        
        // End travel if arrived at destination
        if (this.travelMode && this.travelRoute && locationName === this.travelRoute.to) {
            this.endTravel();
        }

        return this.lastLocation;
    }

    /**
     * End travel mode
     */
    endTravel() {
        this.travelMode = false;
        this.travelRoute = null;
        this.travelStartTime = null;
    }

    /**
     * Get tools for LLM integration
     */
    getMapTools() {
        return [
            {
                name: 'get_location_info',
                description: 'Get detailed information about a location',
                parameters: {
                    location: { type: 'string', description: 'Name of the location' }
                },
                handler: (params) => {
                    return this.mapViewer.getLocationContext(params.location);
                }
            },
            {
                name: 'find_nearby_locations',
                description: 'Find locations near a given location',
                parameters: {
                    location: { type: 'string', description: 'Name of the location' },
                    count: { type: 'number', description: 'Number of nearby locations to return' }
                },
                handler: (params) => {
                    const loc = this.mapViewer.findLocation(params.location);
                    return loc ? this.mapViewer.findNearbyLocations(loc, params.count || 5) : [];
                }
            },
            {
                name: 'calculate_travel_route',
                description: 'Calculate travel route between two locations',
                parameters: {
                    from: { type: 'string', description: 'Starting location' },
                    to: { type: 'string', description: 'Destination location' }
                },
                handler: (params) => {
                    return this.mapViewer.calculateRoute(params.from, params.to);
                }
            },
            {
                name: 'start_travel',
                description: 'Begin traveling to a destination',
                parameters: {
                    destination: { type: 'string', description: 'Destination location' }
                },
                handler: (params) => {
                    const currentLocation = this.lastLocation?.name || 'current location';
                    return this.startTravel(currentLocation, params.destination);
                }
            },
            {
                name: 'get_travel_progress',
                description: 'Get current travel progress',
                parameters: {},
                handler: () => {
                    if (!this.travelMode) {
                        return { status: 'Not traveling' };
                    }
                    return this.calculateTravelProgress();
                }
            }
        ];
    }
}