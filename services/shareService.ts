import { ShareCardData } from '../types';

/**
 * Share Service - Handles generating shareable card images and sharing to platforms
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

/**
 * Get day of week for a given date
 */
const getDayOfWeek = (year: number, month: number, day: number, era: 'CE' | 'BCE'): string => {
  // For BCE dates, JavaScript Date uses negative years
  const jsYear = era === 'BCE' ? -(year - 1) : year;
  const jsMonth = month - 1; // JavaScript months are 0-based
  
  const date = new Date(jsYear, jsMonth, day);
  return DAYS_OF_WEEK[date.getDay()];
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  const latStr = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lngStr}`;
};

/**
 * Format date for display
 */
export const formatDate = (date: { year: number; month: number; day: number; era: 'CE' | 'BCE' }): string => {
  const dayName = getDayOfWeek(date.year, date.month, date.day, date.era);
  return `${dayName} ${MONTHS[date.month - 1]} ${date.day} of ${date.year} ${date.era}`;
};

/**
 * Format location text for display, splitting into lines for better readability
 */
export const formatLocationText = (locationName: string | undefined, lat: number, lng: number): string[] => {
  if (!locationName) {
    return [formatCoordinates(lat, lng)];
  }

  // Split by comma and clean up
  const parts = locationName.split(',').map(part => part.trim()).filter(part => part.length > 0);

  if (parts.length === 1) {
    // Only one part (e.g., just city or just country)
    return [parts[0]];
  } else if (parts.length === 2) {
    // Two parts: likely "City, Country" - put on separate lines
    return [parts[0], parts[1]];
  } else if (parts.length >= 3) {
    // Three or more parts: "City, State, Country" - city on first line, state/country on second
    const city = parts[0];
    const rest = parts.slice(1).join(', ');
    return [city, rest];
  }

  return [locationName];
};

/**
 * Format time for display (12-hour format)
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Wrap text to fit within a maximum width
 */
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

/**
 * Format date and time text for display, splitting into lines for better readability
 */
export const formatDateTimeText = (date: { year: number; month: number; day: number; era: 'CE' | 'BCE' }, time: string): string[] => {
  const dayName = getDayOfWeek(date.year, date.month, date.day, date.era);
  const formattedTime = formatTime(time);
  
  // Split into two lines for better readability
  const line1 = `Moment taken in ${dayName} ${MONTHS[date.month - 1]} ${date.day}`;
  const line2 = `of the year ${date.year} ${date.era} at ${formattedTime}`;
  
  return [line1, line2];
};

/**
 * Generate a shareable card image as a data URL
 */
export const generateShareCardImage = async (data: ShareCardData): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Card dimensions - optimized for 9:16 aspect ratio (Instagram Stories, TikTok, etc.)
    const width = 1080;
    const height = 1920;
    
    canvas.width = width;
    canvas.height = height;

    // Load the main image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // 1. Draw the main image covering the entire canvas (object-fit: cover)
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      
      let renderWidth, renderHeight, offsetX, offsetY;
      
      if (imgRatio > canvasRatio) {
        // Image is wider than canvas
        renderHeight = height;
        renderWidth = img.width * (height / img.height);
        offsetX = (width - renderWidth) / 2;
        offsetY = 0;
      } else {
        // Image is taller than canvas
        renderWidth = width;
        renderHeight = img.height * (width / img.width);
        offsetX = 0;
        offsetY = (height - renderHeight) / 2;
      }
      
      ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);

      // 2. Add gradient overlay (from black/60 via black/20 to transparent)
      const gradientHeight = height * 0.6; // Gradient covers bottom 60%
      const gradient = ctx.createLinearGradient(0, height - gradientHeight, 0, height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

      // 3. Text Configuration
      const padding = 80;
      const bottomMargin = 80; // Space from bottom
      
      // Font setup
      const fontMono = '"Roboto Mono", monospace';
      const fontSans = '"Manrope", sans-serif';
      
      // "Made in ChronoGlobe" branding - Top Left
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = `500 32px ${fontMono}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      ctx.fillText('Made in ChronoGlobe', padding, padding);
      ctx.shadowColor = 'transparent';
      
      // Handle location text
      const locationLines = formatLocationText(data.locationName, data.location.lat, data.location.lng);
      
      // Calculate positions from bottom up
      let currentY = height - bottomMargin;
      
      // Date and Time (Bottom most)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = `400 38px ${fontSans}`;
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      // Create single line date/time text matching ImageResult format
      const monthName = MONTHS[data.date.month - 1];
      const formattedTime = formatTime(data.time);
      const dateTimeText = `Moment taken in ${monthName} ${data.date.day}, ${data.date.year} ${data.date.era} at ${formattedTime}`;
      
      ctx.fillText(dateTimeText, padding, currentY);
      currentY -= 50;
      
      ctx.shadowColor = 'transparent';
      
      currentY -= 20; // Gap
      
      // Location Subtitle (Region/Country) - Second line of location if available
      if (locationLines.length > 1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = `500 50px ${fontSans}`;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
          
          // Join the rest of the lines
          const subtitle = locationLines.slice(1).join(', ');
          ctx.fillText(subtitle, padding, currentY);
          currentY -= 65;
          
          ctx.shadowColor = 'transparent';
      }
      
      currentY -= 15; // Gap
      
      // Context text (if available) - wrap and display
      if (data.context) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.font = `400 38px ${fontSans}`;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
          
          const maxWidth = width - (padding * 2);
          const contextLines = wrapText(ctx, data.context, maxWidth);
          
          // Draw each line from bottom to top
          for (let i = contextLines.length - 1; i >= 0; i--) {
              ctx.fillText(contextLines[i], padding, currentY);
              currentY -= 46; // Line height for text-sm with leading-relaxed
          }
          
          ctx.shadowColor = 'transparent';
          currentY -= 15; // Gap after context (mb-3)
      }
      
      // Location Title (City) - First line
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 84px ${fontSans}`; // text-3xl font-extrabold
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      const title = locationLines[0];
      // Auto-scale title if needed
      let fontSize = 84;
      const maxWidth = width - (padding * 2);
      while (ctx.measureText(title).width > maxWidth && fontSize > 40) {
          fontSize -= 4;
          ctx.font = `800 ${fontSize}px ${fontSans}`;
      }
      
      ctx.fillText(title, padding, currentY);

      // Convert to data URL
      resolve(canvas.toDataURL('image/png', 1.0));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = data.imageUrl;
  });
};

/**
 * Download the share card image
 */
export const downloadShareCard = async (data: ShareCardData): Promise<void> => {
  try {
    const dataUrl = await generateShareCardImage(data);
    const link = document.createElement('a');
    link.download = `chronoglobe-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to download share card:', error);
    throw error;
  }
};

/**
 * Download the original image in full quality
 */
export const downloadOriginalImage = async (imageUrl: string): Promise<void> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `chronoglobe-original-${Date.now()}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download original image:', error);
    throw error;
  }
};

/**
 * Share to WhatsApp (opens WhatsApp with pre-filled message)
 * Note: WhatsApp Web doesn't support direct image sharing, so we share a link/message
 */
export const shareToWhatsApp = async (data: ShareCardData): Promise<void> => {
  const locationText = data.locationName || formatCoordinates(data.location.lat, data.location.lng);
  const dateText = formatDate(data.date);
  const timeText = formatTime(data.time);
  
  const message = encodeURIComponent(
    `🌍 ChronoGlobe Time Travel\n\n📍 ${locationText}\n📅 Moment taken in ${dateText} at ${timeText}\n\nExplore history at chronoglobe.app`
  );
  
  window.open(`https://wa.me/?text=${message}`, '_blank');
};

/**
 * Share using native Web Share API (for mobile)
 * Works on iOS Safari, Android Chrome, and other mobile browsers
 */
export const shareNative = async (data: ShareCardData): Promise<boolean> => {
  // Check if Web Share API is available
  if (!navigator.share) {
    console.log('Web Share API not available');
    return false;
  }

  try {
    const dataUrl = await generateShareCardImage(data);
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'chronoglobe-share.png', { type: 'image/png' });

    // Check if the browser supports sharing files
    const shareData: ShareData = {
      title: 'ChronoGlobe',
      text: `Time travel to ${data.locationName || formatCoordinates(data.location.lat, data.location.lng)} on ${formatDate(data.date)}`,
      files: [file]
    };

    // Check if we can share files (not all browsers support it)
    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }
    
    // Fallback: try sharing without files (just text)
    const textOnlyShare: ShareData = {
      title: 'ChronoGlobe',
      text: `🌍 ChronoGlobe Time Travel\n\n📍 ${data.locationName || formatCoordinates(data.location.lat, data.location.lng)}\n📅 Moment taken in ${formatDate(data.date)} at ${formatTime(data.time)}\n\nDownload the app to explore history!`
    };
    
    if (navigator.canShare && navigator.canShare(textOnlyShare)) {
      await navigator.share(textOnlyShare);
      // Return false to indicate image wasn't shared, so user knows to download
      return false;
    }

    return false;
  } catch (error: any) {
    // User cancelled sharing (this is normal, not an error)
    if (error.name === 'AbortError') {
      console.log('User cancelled sharing');
      return true; // Return true because it's not an error, user just cancelled
    }
    console.log('Native share failed:', error);
    return false;
  }
};

/**
 * Copy share card to clipboard
 */
export const copyShareCardToClipboard = async (data: ShareCardData): Promise<boolean> => {
  try {
    const dataUrl = await generateShareCardImage(data);
    const blob = await (await fetch(dataUrl)).blob();
    
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob
      })
    ]);
    
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
