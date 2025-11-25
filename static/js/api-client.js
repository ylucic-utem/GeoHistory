/**
 * API Client Module
 * Handles communication with the backend API
 */

const API_BASE = '';

/**
 * Generate a historical image
 * @param {Object} data - Request data
 * @returns {Promise<Object>} - Response data
 */
export async function generateImage(data) {
    const response = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
}

/**
 * Get timezone information for coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Timezone data
 */
export async function getTimezone(lat, lng) {
    const response = await fetch(`${API_BASE}/api/timezone`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lat: lat, lng: lng })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
}

/**
 * Health check
 * @returns {Promise<Object>} - Health status
 */
export async function healthCheck() {
    const response = await fetch(`${API_BASE}/api/health`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
}
