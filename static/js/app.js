/**
 * Main Application Controller
 * Initializes and coordinates all modules
 */

import * as MapModule from './map.js';
import * as DatePicker from './datepicker.js';
import * as APIClient from './api-client.js';
import * as ImagePreview from './image-preview.js';

// State
let currentPin = null;
let timezoneOffset = 0;
let isGenerating = false;

// DOM Elements
const elements = {};

/**
 * Initialize the application
 */
function init() {
    // Cache DOM elements
    cacheElements();
    
    // Initialize sub-modules
    initializeMap();
    initializeDatePicker();
    initializeImagePreview();
    
    // Set up UI event listeners
    setupEventListeners();
    
    console.log('🌍 GeoHistory app initialized');
}

/**
 * Cache DOM element references
 */
function cacheElements() {
    elements.controlPanel = document.getElementById('controlPanel');
    elements.panelToggle = document.getElementById('panelToggle');
    elements.pinInfo = document.getElementById('pinInfo');
    elements.noPin = document.getElementById('noPin');
    elements.pinCoords = document.getElementById('pinCoords');
    elements.pinTimezone = document.getElementById('pinTimezone');
    elements.btnClearPin = document.getElementById('btnClearPin');
    elements.btnGenerate = document.getElementById('btnGenerate');
    elements.errorMessage = document.getElementById('errorMessage');
    elements.errorText = document.getElementById('errorText');
    elements.promptDisplay = document.getElementById('promptDisplay');
    elements.promptText = document.getElementById('promptText');
    elements.generatedImage = document.getElementById('generatedImage');
    elements.resultImage = document.getElementById('resultImage');
    elements.downloadLink = document.getElementById('downloadLink');
    elements.responseText = document.getElementById('responseText');
    elements.responseContent = document.getElementById('responseContent');
    elements.coordsDisplay = document.getElementById('coordsDisplay');
    elements.coordsText = document.getElementById('coordsText');
}

/**
 * Initialize the map module
 */
function initializeMap() {
    MapModule.init('mapContainer', {
        initialView: { lat: 20, lng: 0, zoom: 2 }
    });

    // Set up pin placement callback
    MapModule.onPinPlaced(handlePinPlaced);

    // Set up mouse move callback for coordinate display
    MapModule.onMouseMove(handleMouseMove);
}

/**
 * Initialize the date picker module
 */
function initializeDatePicker() {
    DatePicker.init({
        monthSelect: document.getElementById('monthSelect'),
        daySelect: document.getElementById('daySelect'),
        yearInput: document.getElementById('yearInput'),
        eraSelect: document.getElementById('eraSelect'),
        hourSelect: document.getElementById('hourSelect'),
        utcTimeDisplay: document.getElementById('utcTime')
    }, {
        month: 4,
        day: 3,
        year: 33,
        era: 'CE',
        hour: 15
    });
}

/**
 * Initialize the image preview module
 */
function initializeImagePreview() {
    ImagePreview.init({
        modal: document.getElementById('imagePreviewModal'),
        image: document.getElementById('modalImage'),
        close: document.getElementById('modalClose'),
        caption: document.getElementById('modalCaption')
    });
    
    // Attach to result image
    if (elements.resultImage) {
        ImagePreview.attachToImage(elements.resultImage, 'Generated Historical Image');
    }
}

/**
 * Set up UI event listeners
 */
function setupEventListeners() {
    // Panel toggle
    if (elements.panelToggle) {
        elements.panelToggle.addEventListener('click', togglePanel);
    }
    
    // Clear pin button
    if (elements.btnClearPin) {
        elements.btnClearPin.addEventListener('click', clearPin);
    }
    
    // Generate button
    if (elements.btnGenerate) {
        elements.btnGenerate.addEventListener('click', generateImage);
    }
}

/**
 * Handle pin placement on globe
 * @param {Object} coords - {lat, lng}
 */
async function handlePinPlaced(coords) {
    currentPin = coords;
    
    // Fetch real timezone
    try {
        const timezoneData = await APIClient.getTimezone(coords.lat, coords.lng);
        timezoneOffset = timezoneData.offset_hours;
        const timezoneName = timezoneData.timezone_name;
        
        // Update UI
        if (elements.pinInfo) elements.pinInfo.style.display = 'block';
        if (elements.noPin) elements.noPin.style.display = 'none';
        if (elements.pinCoords) {
            elements.pinCoords.textContent = MapModule.formatCoords(coords.lat, coords.lng);
        }
        if (elements.pinTimezone) {
            elements.pinTimezone.textContent = `Local Timezone: ${timezoneName}`;
        }
        if (elements.btnGenerate) elements.btnGenerate.disabled = false;
        
        // Update date picker timezone
        DatePicker.setTimezoneOffset(timezoneOffset);
        
        // Clear previous results
        clearResults();
    } catch (error) {
        console.error('Failed to fetch timezone:', error);
        // Fallback to approximate
        timezoneOffset = MapModule.calculateTimezoneOffset(coords.lng);
        
        // Update UI
        if (elements.pinInfo) elements.pinInfo.style.display = 'block';
        if (elements.noPin) elements.noPin.style.display = 'none';
        if (elements.pinCoords) {
            elements.pinCoords.textContent = MapModule.formatCoords(coords.lat, coords.lng);
        }
        if (elements.pinTimezone) {
            elements.pinTimezone.textContent = `Local Timezone: UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset} (approx)`;
        }
        if (elements.btnGenerate) elements.btnGenerate.disabled = false;
        
        // Update date picker timezone
        DatePicker.setTimezoneOffset(timezoneOffset);
        
        // Clear previous results
        clearResults();
    }
}

/**
 * Handle mouse movement over map
 * @param {Object|null} coords - {lat, lng} or null
 */
function handleMouseMove(coords) {
    if (coords && elements.coordsDisplay && elements.coordsText) {
        elements.coordsText.textContent = MapModule.formatCoords(coords.lat, coords.lng);
        elements.coordsDisplay.style.display = 'block';
    } else if (elements.coordsDisplay) {
        elements.coordsDisplay.style.display = 'none';
    }
}

/**
 * Toggle control panel visibility
 */
function togglePanel() {
    if (elements.controlPanel) {
        elements.controlPanel.classList.toggle('open');
        elements.controlPanel.classList.toggle('closed');
        if (elements.panelToggle) {
            elements.panelToggle.textContent = elements.controlPanel.classList.contains('open') ? '◀' : '▶';
        }
    }
}

/**
 * Clear the current pin
 */
function clearPin() {
    MapModule.clearPin();
    currentPin = null;
    
    if (elements.pinInfo) elements.pinInfo.style.display = 'none';
    if (elements.noPin) elements.noPin.style.display = 'block';
    if (elements.btnGenerate) elements.btnGenerate.disabled = true;
    
    DatePicker.hideUtcDisplay();
    clearResults();
}

/**
 * Clear result displays
 */
function clearResults() {
    if (elements.errorMessage) elements.errorMessage.style.display = 'none';
    if (elements.generatedImage) elements.generatedImage.style.display = 'none';
    if (elements.responseText) elements.responseText.style.display = 'none';
    if (elements.promptDisplay) elements.promptDisplay.style.display = 'none';
}

/**
 * Generate historical image
 */
async function generateImage() {
    if (!currentPin || isGenerating) return;
    
    isGenerating = true;
    
    // Update button state
    if (elements.btnGenerate) {
        elements.btnGenerate.disabled = true;
        elements.btnGenerate.innerHTML = '<span class="spinner"></span> Generating...';
        elements.btnGenerate.classList.add('generating');
    }
    
    clearResults();
    
    // Get date/time values
    const dateValues = DatePicker.getValues();
    
    const requestData = {
        lat: currentPin.lat,
        lng: currentPin.lng,
        month: dateValues.month,
        day: dateValues.day,
        year: dateValues.year,
        hour: dateValues.hour
    };
    
    try {
        const data = await APIClient.generateImage(requestData);
        
        if (data.error) {
            showError(data.error);
        } else {
            // Show prompt
            if (data.prompt && elements.promptText && elements.promptDisplay) {
                elements.promptText.textContent = '"' + data.prompt + '"';
                elements.promptDisplay.style.display = 'block';
            }
            
            // Show image
            if (data.images && data.images.length > 0 && elements.resultImage && elements.generatedImage) {
                elements.resultImage.src = data.images[0].url;
                if (elements.downloadLink) {
                    elements.downloadLink.href = data.images[0].url;
                }
                elements.generatedImage.style.display = 'block';
            }
            
            // Show response text
            if (data.text && elements.responseContent && elements.responseText) {
                elements.responseContent.textContent = data.text;
                elements.responseText.style.display = 'block';
            }
        }
    } catch (err) {
        showError('Failed to generate image: ' + err.message);
    } finally {
        isGenerating = false;
        if (elements.btnGenerate) {
            elements.btnGenerate.disabled = false;
            elements.btnGenerate.innerHTML = '✨ Generate Historical Image';
            elements.btnGenerate.classList.remove('generating');
        }
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    if (elements.errorText) {
        elements.errorText.textContent = '⚠️ ' + message;
    }
    if (elements.errorMessage) {
        elements.errorMessage.style.display = 'block';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
