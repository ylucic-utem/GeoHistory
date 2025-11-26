"""
GeoHistory - Historical Image Generator Web Application
A Flask backend that serves the globe UI and handles image generation via Gemini API.
"""

import os
import requests
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

from gemini_api import GeminiImageGenerator
from utils import (
    build_historical_prompt,
    validate_coordinates,
    validate_date,
    validate_hour,
    calculate_timezone_offset
)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Configuration
IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'generated_images')
os.makedirs(IMAGES_DIR, exist_ok=True)

# Initialize Gemini client
gemini = GeminiImageGenerator(output_dir=IMAGES_DIR)


# =============================================================================
# Routes - Pages
# =============================================================================

@app.route('/')
def index():
    """Serve the main application page."""
    return render_template('index.html')


# =============================================================================
# Routes - Static Files
# =============================================================================

@app.route('/images/<filename>')
def serve_image(filename):
    """Serve generated images."""
    return send_from_directory(IMAGES_DIR, filename)


# =============================================================================
# Routes - API Endpoints
# =============================================================================

@app.route('/api/generate', methods=['POST'])
def generate():
    """
    API endpoint to generate historical images.
    
    Expected JSON body:
    {
        "lat": float,      # Latitude
        "lng": float,      # Longitude
        "month": int,      # Month (1-12)
        "day": int,        # Day (1-31)
        "year": int,       # Year (negative for BCE)
        "hour": int        # Hour (0-23)
    }
    
    Returns:
    {
        "prompt": str,     # The prompt sent to the model
        "images": list,    # List of {url, mime_type}
        "text": str        # Any text response
    }
    or
    {
        "error": str       # Error message
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['lat', 'lng', 'month', 'day', 'year', 'hour']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Parse and validate inputs
        lat = float(data['lat'])
        lng = float(data['lng'])
        month = int(data['month'])
        day = int(data['day'])
        year = int(data['year'])
        hour = int(data['hour'])
        
        # Validate coordinates
        is_valid, error_msg = validate_coordinates(lat, lng)
        if not is_valid:
            return jsonify({"error": error_msg}), 400
        
        # Validate date
        is_valid, error_msg = validate_date(month, day)
        if not is_valid:
            return jsonify({"error": error_msg}), 400
        
        # Validate hour
        is_valid, error_msg = validate_hour(hour)
        if not is_valid:
            return jsonify({"error": error_msg}), 400
        
        # Build prompt and generate image
        prompt = build_historical_prompt(lat, lng, month, day, year, hour)
        result = gemini.generate_image(prompt)
        
        if "error" in result:
            return jsonify(result), 500
        
        return jsonify(result)
        
    except ValueError as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route('/api/timezone', methods=['POST'])
def get_timezone():
    """
    Get timezone information for coordinates.
    
    Expected JSON body:
    {
        "lat": float,  # Latitude
        "lng": float   # Longitude
    }
    
    Returns:
    {
        "offset_hours": int,
        "timezone_name": str
    }
    """
    try:
        data = request.get_json()
        lat = float(data.get('lat', 0))
        lng = float(data.get('lng', 0))
        
        # Try to get real timezone from API
        try:
            import requests
            response = requests.get(
                f'https://api.bigdatacloud.net/data/time_zone?latitude={lat}&longitude={lng}&key=demo',
                timeout=5
            )
            if response.status_code == 200:
                tz_data = response.json()
                offset_seconds = tz_data.get('offsetSeconds', 0)
                offset_hours = offset_seconds // 3600
                timezone_name = tz_data.get('ianaTimeZoneId', f'UTC{offset_hours:+d}')
                
                return jsonify({
                    "offset_hours": offset_hours,
                    "timezone_name": timezone_name
                })
        except Exception as e:
            print(f"Timezone API failed: {e}")
        
        # Fallback to approximate calculation
        offset = calculate_timezone_offset(lng)
        
        return jsonify({
            "offset_hours": offset,
            "timezone_name": f"UTC{offset:+d} (approx)"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "gemini_configured": gemini.is_configured()
    })


# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == '__main__':
    print("=" * 50)
    print("🌍 GeoHistory - Historical Image Generator")
    print("=" * 50)
    print(f"Server: http://localhost:5000")
    print(f"Images: {IMAGES_DIR}")
    print(f"Gemini API: {'✓ Configured' if gemini.is_configured() else '✗ Not configured'}")
    print("=" * 50)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
