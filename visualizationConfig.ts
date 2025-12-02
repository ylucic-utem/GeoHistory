// Configuration for visualization styles
export const visualizationConfig = {
  // Zoom threshold for scaling markers
  zoomThreshold: 9,

  // Conflict points
  conflicts: {
    radius: 5,
    radiusZoomed: 10,
    color: 'rgb(255, 59, 48)', // Red
    fillColor: 'rgb(255, 59, 48)',
    opacity: 1,
    fillOpacity: 1,
    weight: 0
  },

  // Event points
  events: {
    radius: 5,
    radiusZoomed: 10,
    color: 'rgb(52, 199, 89)', // Green
    fillColor: 'rgb(52, 199, 89)',
    opacity: 1,
    fillOpacity: 1,
    weight: 0
  },

  // Heritage points (UNESCO)
  heritage: {
    radius: 5,
    radiusZoomed: 10,
    color: 'rgb(0, 122, 255)', // Blue
    fillColor: 'rgb(0, 122, 255)',
    opacity: 1,
    fillOpacity: 1,
    weight: 0
  },

  // User selected location pin (2D)
  selectedPin: {
    backgroundColor: 'rgb(239, 68, 68)', // Red
    borderColor: 'white',
    size: 24,
    borderWidth: 3
  }
};