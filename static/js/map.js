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

    // Set up click detection
    setupClickDetection();

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