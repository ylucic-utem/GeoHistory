/**
 * Map Module
 * Handles Leaflet map visualization with OpenStreetMap tiles and pin placement
 */

let map = null;
let marker = null;
let onPinPlacedCallback = null;
let onMouseMoveCallback = null;

// Private state
let currentPin = null;
let conflictsLayer = null;
let eventsLayer = null;
let tooltipElement = null;
let tooltipAnchor = null;
let currentZoom = 2;

/**
 * Initialize the Leaflet map with OpenStreetMap tiles
 * @param {string} targetId - DOM element ID for the map
 * @param {Object} options - Configuration options
 */
export function init(targetId, options = {}) {
    // Initialize the map
    map = L.map(targetId).setView([20, 0], 2); // Initial view: lat, lng, zoom

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 2
    }).addTo(map);

    // Create layer groups for conflicts and events
    conflictsLayer = L.layerGroup().addTo(map);
    eventsLayer = L.layerGroup().addTo(map);

    // Create tooltip element
    createTooltipElement();

    // Set up click detection
    setupClickDetection();

    // Set up zoom tracking
    map.on('zoomend', () => {
        currentZoom = map.getZoom();
        // Reload markers with new size
        reloadMarkers();
    });

    // Update tooltip position continuously during map movement
    map.on('move', updateTooltipPosition);
    map.on('moveend', updateTooltipPosition);
    map.on('zoom', updateTooltipPosition);

    // Load conflict and event data
    loadConflictsAndEvents();

    console.log('🗺️ Leaflet map initialized');

    return map;
}

/**
 * Set up click detection on the map
 */
function setupClickDetection() {
    if (!map) return;

    // Handle map clicks
    map.on('click', function(e) {
        // Hide anchored tooltip when placing a new pin
        if (tooltipAnchor) {
            hideTooltip();
        }
        
        const coords = {
            lat: e.latlng.lat,
            lng: e.latlng.lng
        };
        console.log('Map click detected at:', coords);
        placePin(coords.lat, coords.lng);
        if (onPinPlacedCallback) {
            onPinPlacedCallback(coords);
        }
    });

    // Handle mouse movement for coordinate display
    map.on('mousemove', function(e) {
        if (onMouseMoveCallback) {
            onMouseMoveCallback({
                lat: e.latlng.lat,
                lng: e.latlng.lng
            });
        }
    });
}

/**
 * Place a pin on the map
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
export function placePin(lat, lng) {
    console.log('placePin called with:', lat, lng);

    // Remove existing marker if any
    if (marker) {
        map.removeLayer(marker);
    }

    // Create new marker
    marker = L.marker([lat, lng]).addTo(map);

    // Store pin data
    currentPin = { lat, lng };

    // Pan to the marker
    map.panTo([lat, lng]);

    console.log('Pin placed at:', lat, lng);
}

/**
 * Clear the current pin
 */
export function clearPin() {
    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }
    currentPin = null;
}

/**
 * Get the current pin coordinates
 * @returns {Object|null} - {lat, lng} or null
 */
export function getPin() {
    return currentPin;
}

/**
 * Set callback for when a pin is placed
 * @param {Function} callback - Callback function receiving {lat, lng}
 */
export function onPinPlaced(callback) {
    onPinPlacedCallback = callback;
}

/**
 * Set callback for mouse move
 * @param {Function} callback - Callback function receiving {lat, lng} or null
 */
export function onMouseMove(callback) {
    onMouseMoveCallback = callback;
}

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} - Formatted coordinate string
 */
export function formatCoords(lat, lng) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Fly to a specific location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} zoom - Zoom level
 */
export function flyTo(lat, lng, zoom = 10) {
    if (map) {
        map.flyTo([lat, lng], zoom);
    }
}

/**
 * Get the map instance
 * @returns {Object} - Leaflet map instance
 */
export function getMap() {
    return map;
}

/**
 * Calculate timezone offset from longitude (approximate)
 * @param {number} lng - Longitude
 * @returns {number} - Timezone offset in hours
 */
export function calculateTimezoneOffset(lng) {
    return Math.round(lng / 15);
}

/**
 * Create tooltip DOM element
 */
function createTooltipElement() {
    tooltipElement = document.createElement('div');
    tooltipElement.style.cssText = `
        position: fixed;
        display: none;
        max-width: 280px;
        z-index: 10000;
        background: rgba(20,20,24,0.95);
        color: #fff;
        padding: 8px 10px;
        border-radius: 6px;
        box-shadow: 0 6px 16px rgba(0,0,0,0.35);
        pointer-events: auto;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        font-size: 12px;
        line-height: 1.35;
    `;
    document.body.appendChild(tooltipElement);
}

/**
 * Show tooltip at position
 */
function showTooltip(x, y, data, anchorLat, anchorLng) {
    if (!tooltipElement) return;
    
    // Only set anchor if coordinates are provided
    if (anchorLat !== undefined && anchorLng !== undefined) {
        tooltipAnchor = { lat: anchorLat, lng: anchorLng };
        console.log('Tooltip anchored at:', tooltipAnchor);
    } else {
        console.log('Tooltip shown without anchor (hover mode)');
    }
    
    let html = '';
    if (data.name) html += `<div style="font-weight: 600; margin-bottom: 4px">${data.name}</div>`;
    if (data.place) html += `<div style="margin-bottom: 2px">${data.place}</div>`;
    if (data.country) html += `<div style="margin-bottom: 2px">${data.country}</div>`;
    if (data.year) html += `<div style="margin-bottom: 2px">${data.year}</div>`;
    if (data.context) html += `<div style="opacity: 0.9; margin-bottom: 8px">${data.context}</div>`;
    
    tooltipElement.innerHTML = html;
    tooltipElement.style.display = 'block';
    tooltipElement.style.top = (y + 12) + 'px';
    tooltipElement.style.left = (x + 12) + 'px';
}

/**
 * Hide tooltip
 */
function hideTooltip() {
    if (tooltipElement) {
        tooltipElement.style.display = 'none';
        tooltipAnchor = null;
    }
}

/**
 * Update tooltip position based on anchored coordinates
 */
function updateTooltipPosition() {
    if (tooltipAnchor && tooltipElement && tooltipElement.style.display === 'block') {
        const point = map.latLngToContainerPoint([tooltipAnchor.lat, tooltipAnchor.lng]);
        tooltipElement.style.top = (point.y + 12) + 'px';
        tooltipElement.style.left = (point.x + 12) + 'px';
        console.log('Updated tooltip position to:', point.x, point.y);
    }
}

/**
 * Load conflicts and events data
 */
async function loadConflictsAndEvents() {
    try {
        // Load conflicts
        const conflictsResponse = await fetch('/conflicts_updated.json');
        const conflicts = await conflictsResponse.json();
        addConflictMarkers(conflicts);

        // Load events
        const eventsResponse = await fetch('/events_final.json');
        const events = await eventsResponse.json();
        addEventMarkers(events);
    } catch (error) {
        console.error('Failed to load conflicts/events:', error);
    }
}

/**
 * Get marker radius based on zoom level
 */
function getMarkerRadius(baseRadius, zoomedRadius) {
    const zoomThreshold = 9;
    return currentZoom > zoomThreshold ? zoomedRadius : baseRadius;
}

/**
 * Add conflict markers to map
 */
function addConflictMarkers(conflicts) {
    conflictsLayer.clearLayers();
    
    const radius = getMarkerRadius(5, 10);
    
    conflicts.forEach(conflict => {
        if (conflict.lat != null && conflict.lng != null && !isNaN(conflict.lat) && !isNaN(conflict.lng)) {
            const marker = L.circleMarker([conflict.lat, conflict.lng], {
                radius: radius,
                fillColor: 'rgb(212, 2, 2)',
                color: 'rgb(212, 2, 2)',
                weight: 0,
                opacity: 1,
                fillOpacity: 1
            }).addTo(conflictsLayer);

            // Hover events (don't show on hover if already anchored)
            marker.on('mouseover', (e) => {
                if (!tooltipAnchor) {
                    const data = {
                        name: conflict.name,
                        place: conflict.country,
                        year: conflict.year,
                        context: conflict.context
                    };
                    showTooltip(e.originalEvent.clientX, e.originalEvent.clientY, data);
                }
            });

            marker.on('mouseout', () => {
                if (!tooltipAnchor) {
                    hideTooltip();
                }
            });

            // Click event - anchor tooltip
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                const point = map.latLngToContainerPoint([conflict.lat, conflict.lng]);
                showTooltip(point.x, point.y, {
                    name: conflict.name,
                    place: conflict.place || conflict.country,
                    country: conflict.country,
                    year: conflict.year,
                    context: conflict.context
                }, conflict.lat, conflict.lng);
            });
        }
    });
}

/**
 * Add event markers to map
 */
function addEventMarkers(events) {
    eventsLayer.clearLayers();
    
    const radius = getMarkerRadius(5, 10);
    
    events.forEach(event => {
        if (event.lat != null && event.lng != null && !isNaN(event.lat) && !isNaN(event.lng)) {
            const marker = L.circleMarker([event.lat, event.lng], {
                radius: radius,
                fillColor: 'rgba(6, 2, 233, 1)',
                color: 'rgba(6, 2, 233, 1)',
                weight: 0,
                opacity: 1,
                fillOpacity: 1
            }).addTo(eventsLayer);

            // Hover events (don't show on hover if already anchored)
            marker.on('mouseover', (e) => {
                if (!tooltipAnchor) {
                    const data = {
                        name: event.name,
                        place: event.place,
                        country: event.country,
                        year: event.year,
                        context: event.context
                    };
                    showTooltip(e.originalEvent.clientX, e.originalEvent.clientY, data);
                }
            });

            marker.on('mouseout', () => {
                if (!tooltipAnchor) {
                    hideTooltip();
                }
            });

            // Click event - anchor tooltip
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                const point = map.latLngToContainerPoint([event.lat, event.lng]);
                showTooltip(point.x, point.y, {
                    name: event.name,
                    place: event.place,
                    country: event.country,
                    year: event.year,
                    context: event.context
                }, event.lat, event.lng);
            });
        }
    });
}

/**
 * Reload markers with updated sizes
 */
function reloadMarkers() {
    // We need to reload the data since we can't directly change marker radius
    // in Leaflet after creation
    loadConflictsAndEvents();
}