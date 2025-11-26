/**
 * Globe Module
 * Handles OpenGlobus globe visualization with click detection for pin placement
 */

import { 
    Globe, 
    GlobusRgbTerrain, 
    OpenStreetMap, 
    Bing,
    Vector, 
    Entity, 
    LonLat,
    control 
} from 'https://cdn.jsdelivr.net/npm/@openglobus/og/lib/og.es.js';

// Private state
let globe = null;
let pinEntity = null;
let pinLayer = null;
let currentPin = null;
let onPinPlacedCallback = null;
let onMouseMoveCallback = null;
let pinMarkerEl = null;
let containerId = null;

// Drag detection state
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
const dragThreshold = 5; // pixels

/**
 * Initialize the OpenGlobus globe with invisible click overlay
 * @param {string} targetId - DOM element ID for the globe
 * @param {Object} options - Configuration options
 */
export function init(targetId, options = {}) {
    containerId = targetId;
    
    // Create OpenStreetMap layer
    const osm = new OpenStreetMap("OSM", {
        textureFilter: "linear",
        isBaseLayer: true,
        visibility: true
    });
    
    // Create Bing satellite layer for layer switching
    const sat = new Bing("Bing Satellite", {
        textureFilter: "linear",
        isBaseLayer: true,
        visibility: false
    });
    
    // Create vector layer for pins (kept for potential future use)
    pinLayer = new Vector("Pins", {
        clampToGround: true,
        async: false
    });
    
    // Initialize OpenGlobus globe
    globe = new Globe({
        target: targetId,
        name: "Earth",
        terrain: new GlobusRgbTerrain("Terrain", {
            gridSizeByZoom: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]
        }),
        layers: [osm, sat, pinLayer],
        atmosphereEnabled: true,
        transitionOpacityEnabled: false,
        resourcesSrc: "https://cdn.jsdelivr.net/npm/@openglobus/og/lib/res",
        fontsSrc: "https://cdn.jsdelivr.net/npm/@openglobus/og/lib/res/fonts"
    });
    
    // Add controls
    globe.planet.addControls([
        new control.LayerSwitcher(),
        new control.MouseNavigation(),
        new control.TouchNavigation(),
        new control.ZoomControl(),
        new control.ScaleLine()
    ]);
    
    // Optimize graphics for smoother rendering
    globe.planet.setLodSize(356, 562);
    
    // Set initial view
    const initialPosition = options.initialPosition || { lng: 0, lat: 20, altitude: 20000000 };
    globe.planet.flyLonLat(new LonLat(
        initialPosition.lng,
        initialPosition.lat,
        initialPosition.altitude
    ));
    
    // Create HTML pin marker element
    createPinMarkerElement(targetId);
    
    // Set up click detection that works with OpenGlobus navigation
    setupClickDetection(targetId);
    
    // Start pin position update loop
    requestAnimationFrame(updatePinPosition);
    
    console.log('🌍 OpenGlobus globe initialized');
    
    return globe;
}

/**
 * Create HTML pin marker element
 */
function createPinMarkerElement(targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    
    pinMarkerEl = document.createElement('div');
    pinMarkerEl.id = 'pinMarker';
    pinMarkerEl.innerHTML = `
        <svg width="32" height="48" viewBox="0 0 32 48">
            <path d="M16 48 C16 48 2 28 2 16 C2 7 8 0 16 0 C24 0 30 7 30 16 C30 28 16 48 16 48Z" 
                  fill="#ff4444" stroke="#cc0000" stroke-width="2"/>
            <circle cx="16" cy="14" r="6" fill="white"/>
        </svg>
    `;
    pinMarkerEl.style.cssText = `
        position: absolute;
        pointer-events: none;
        transform: translate(-50%, -100%);
        z-index: 50;
        display: none;
        filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));
    `;
    container.appendChild(pinMarkerEl);
}

/**
 * Set up click detection that doesn't interfere with globe navigation
 */
function setupClickDetection(targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    
    // Track mouse down position
    container.addEventListener('mousedown', (e) => {
        isDragging = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    });
    
    // Track mouse movement to detect drag
    container.addEventListener('mousemove', (e) => {
        const dx = Math.abs(e.clientX - dragStartX);
        const dy = Math.abs(e.clientY - dragStartY);
        if (dx > dragThreshold || dy > dragThreshold) {
            isDragging = true;
        }
        
        // Update coordinate display
        updateCoordinateDisplay(e);
    });
    
    // Handle click on mouse up (only if not dragging)
    container.addEventListener('mouseup', (e) => {
        const dx = Math.abs(e.clientX - dragStartX);
        const dy = Math.abs(e.clientY - dragStartY);
        
        // If movement was minimal, treat as click
        if (dx < dragThreshold && dy < dragThreshold && !isDragging) {
            handleClick(e);
        }
    });
    
    console.log('Click detection initialized');
}

/**
 * Handle click event - get coordinates from OpenGlobus and place pin
 */
function handleClick(event) {
    if (!globe) return;
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Use OpenGlobus to get coordinates from screen position
    try {
        const lonLat = globe.planet.getLonLatFromPixelTerrain({ x, y });
        
        if (lonLat) {
            const coords = {
                lat: lonLat.lat,
                lng: lonLat.lon
            };
            console.log('Click detected at:', coords);
            placePin(coords.lat, coords.lng);
            if (onPinPlacedCallback) {
                onPinPlacedCallback(coords);
            }
        }
    } catch (e) {
        console.log('Could not get coordinates:', e);
    }
}

/**
 * Update coordinate display on mouse move
 */
function updateCoordinateDisplay(event) {
    if (!globe || !onMouseMoveCallback) return;
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    try {
        const lonLat = globe.planet.getLonLatFromPixelTerrain({ x, y });
        
        if (lonLat) {
            onMouseMoveCallback({
                lat: lonLat.lat,
                lng: lonLat.lon
            });
        } else {
            onMouseMoveCallback(null);
        }
    } catch (e) {
        onMouseMoveCallback(null);
    }
}

/**
 * Update pin marker position on screen (follows globe rotation)
 */
function updatePinPosition() {
    if (currentPin && pinMarkerEl && globe) {
        try {
            // Convert lon/lat to screen coordinates
            const lonLat = new LonLat(currentPin.lng, currentPin.lat, 0);
            const screenPos = globe.planet.getPixelFromLonLat(lonLat);
            
            if (screenPos) {
                pinMarkerEl.style.left = screenPos.x + 'px';
                pinMarkerEl.style.top = screenPos.y + 'px';
                pinMarkerEl.style.display = 'block';
            }
        } catch (e) {
            // Pin might be on the back side of the globe
        }
    }
    
    requestAnimationFrame(updatePinPosition);
}

/**
 * Place a pin on the globe
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
export function placePin(lat, lng) {
    console.log('placePin called with:', lat, lng);
    
    // Store pin data
    currentPin = { lat, lng };
    
    // Show the HTML pin marker
    if (pinMarkerEl) {
        pinMarkerEl.style.display = 'block';
    }
    
    // Also add pin entity to OpenGlobus layer
    try {
        if (pinEntity && pinLayer) {
            pinLayer.removeEntity(pinEntity);
        }
        
        pinEntity = new Entity({
            name: 'Selected Location',
            lonlat: [lng, lat, 100],
            billboard: {
                src: createPinDataUrl(),
                size: [32, 48],
                offset: [0, 24],
                color: "white"
            }
        });
        
        pinLayer.addEntity(pinEntity);
    } catch (e) {
        console.log('OpenGlobus pin entity not added:', e.message);
    }
    
    console.log('Pin placed at:', lat, lng);
}

/**
 * Create pin image data URL using canvas
 * @returns {string} - Data URL of the pin image
 */
function createPinDataUrl() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    
    // Draw pin shape
    ctx.fillStyle = '#ff4444';
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 48);
    ctx.bezierCurveTo(16, 48, 2, 28, 2, 16);
    ctx.bezierCurveTo(2, 7, 8, 0, 16, 0);
    ctx.bezierCurveTo(24, 0, 30, 7, 30, 16);
    ctx.bezierCurveTo(30, 28, 16, 48, 16, 48);
    ctx.fill();
    ctx.stroke();
    
    // Draw inner circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(16, 14, 6, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas.toDataURL();
}

/**
 * Clear the current pin
 */
export function clearPin() {
    if (pinMarkerEl) {
        pinMarkerEl.style.display = 'none';
    }
    
    if (pinEntity && pinLayer) {
        try {
            pinLayer.removeEntity(pinEntity);
        } catch (e) {}
        pinEntity = null;
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
 * @param {number} altitude - Altitude in meters
 */
export function flyTo(lat, lng, altitude = 1000000) {
    if (globe) {
        globe.planet.flyLonLat(new LonLat(lng, lat, altitude));
    }
}

/**
 * Get the globe instance
 * @returns {Object} - OpenGlobus globe instance
 */
export function getGlobe() {
    return globe;
}

/**
 * Calculate timezone offset from longitude
 * @param {number} lng - Longitude
 * @returns {number} - Timezone offset in hours
 */
export function calculateTimezoneOffset(lng) {
    return Math.round(lng / 15);
}
