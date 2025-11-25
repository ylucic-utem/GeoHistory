# GeoHistory - Historical Image Generator

GeoHistory is an innovative web application that generates historical images of any location on Earth at any point in time. Using advanced AI technology, it creates realistic visualizations of how places looked in the past, helping users explore history through visual storytelling.

## 🌟 Features

### Interactive Map Interface
- **2D OpenStreetMap View**: Clean, intuitive map interface using OpenStreetMap tiles with Mercator projection
- **Pin Placement**: Click anywhere on the map to place a location marker
- **Real-time Coordinates**: Displays latitude and longitude as you move the mouse
- **Precise Location Selection**: Accurate coordinate capture for any point on Earth

### Time Travel Functionality
- **Flexible Date Selection**: Choose any date from ancient times to modern day
- **Time Zone Awareness**: Automatically detects and displays local time zones for selected locations
- **Historical Context**: Supports BCE/CE dating for comprehensive historical coverage

### AI-Powered Image Generation
- **Gemini AI Integration**: Uses Google's Gemini AI to generate historically accurate images
- **Contextual Prompts**: Automatically builds detailed prompts based on location, date, and time
- **High-Quality Output**: Generates realistic images with appropriate historical details
- **Multiple Formats**: Supports various image formats and resolutions

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Theme**: Modern, eye-friendly interface
- **Real-time Feedback**: Live coordinate display and timezone information
- **Image Preview**: Modal viewer for generated images with download options

## 🚀 How to Use

1. **Select a Location**: Click anywhere on the map to place a pin at your desired location
2. **Choose Date & Time**: Use the control panel to select the historical date and local time
3. **Generate Image**: Click "Generate Historical Image" to create your visualization
4. **View Results**: See the generated image with the AI prompt used

## 🛠️ Technical Architecture

### Frontend
- **Framework**: Vanilla JavaScript with ES6 modules
- **Map Library**: Leaflet.js with OpenStreetMap tiles
- **Styling**: Custom CSS with responsive design
- **API Communication**: Fetch API for backend communication

### Backend
- **Framework**: Flask (Python)
- **AI Integration**: Google Gemini API for image generation
- **Timezone Service**: BigDataCloud API for accurate timezone data
- **CORS Support**: Cross-origin resource sharing enabled

### Key Components
- **Map Module**: Handles 2D map rendering and user interactions
- **Date Picker**: Custom date/time selection with timezone support
- **API Client**: Manages communication with backend services
- **Image Preview**: Modal system for viewing generated content

## 📋 Requirements

- Python 3.8+
- Flask
- Google Gemini API key
- Modern web browser with JavaScript enabled

## 🔧 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd GeoHistory
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   Create a `.env` file with your API keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the application**:
   ```bash
   python app.py
   ```

5. **Open your browser** and navigate to `http://localhost:5000`

## 🚀 Deployment on Render

1. **Create a GitHub repository** and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Sign up at Render.com** and connect your GitHub account.

3. **Create a new Web Service**:
   - Select your repository
   - Choose **Python** as the runtime
   - Set **Build Command**: `pip install -r requirements.txt`
   - Set **Start Command**: `python app.py`
   - Add environment variables:
     - `GEMINI_API_KEY`: Your Gemini API key
     - `PORT`: (Render sets this automatically, but ensure it's 5000 if needed)

4. **Deploy**: Render will build and deploy your app. Access it via the provided URL.

## 🎯 Use Cases

- **Education**: Visual learning tool for history classes
- **Research**: Historical visualization for academic projects
- **Content Creation**: Unique images for blogs, articles, and social media
- **Personal Interest**: Explore how familiar places looked in the past
- **Storytelling**: Bring historical narratives to life with visual context

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is open source and available under the MIT License.

---

Create a webapp that allows users to explore Earth's history through AI-generated images. This innovative application combines interactive mapping technology with artificial intelligence to transport users back in time, enabling them to visualize any location on Earth as it appeared at any historical moment. By simply clicking on a 2D OpenStreetMap interface to select coordinates, choosing a specific date and time from an intuitive date picker, and leveraging Google's Gemini AI, the webapp generates realistic historical images that bring the past to life. The system intelligently incorporates timezone awareness, ensuring that local time contexts are accurately represented in the generated visualizations, making historical exploration both accessible and educationally valuable for users worldwide.