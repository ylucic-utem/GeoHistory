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

    // Card dimensions - optimized for 3:4 image aspect ratio
    // Using 2x scale for better quality on retina displays and social media
    const scale = 2;
    const baseWidth = 360;
    const basePadding = 20;
    const width = baseWidth * scale;
    const padding = basePadding * scale;
    const imageWidth = width - (padding * 2);
    const imageHeight = Math.round(imageWidth * (4 / 3)); // 3:4 aspect ratio
    const textAreaHeight = 120 * scale; // Space for text and branding (increased for multi-line location)
    const height = padding + imageHeight + textAreaHeight + padding;
    const borderRadius = 20 * scale;

    canvas.width = width;
    canvas.height = height;

    // Load the main image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Background gradient (dark teal like Spotify card)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1a3a4a');
      gradient.addColorStop(1, '#0f2a35');
      
      // Draw rounded rectangle background
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, borderRadius);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw the main image with rounded corners (3:4 aspect ratio)
      const imgY = padding;
      
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(padding, imgY, imageWidth, imageHeight, 12 * scale);
      ctx.clip();
      
      // Calculate aspect ratio to cover the 3:4 frame
      const imgScale = Math.max(imageWidth / img.width, imageHeight / img.height);
      const scaledWidth = img.width * imgScale;
      const scaledHeight = img.height * imgScale;
      const offsetX = padding + (imageWidth - scaledWidth) / 2;
      const offsetY = imgY + (imageHeight - scaledHeight) / 2;
      
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      ctx.restore();

      // Text section
      const textY = imgY + imageHeight + (24 * scale);

      // Location name (main title) - now supports multiple lines
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${20 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      
      // Get location text lines
      const locationLines = formatLocationText(data.locationName, data.location.lat, data.location.lng);
      
      // Draw each line of location text
      let currentY = textY;
      locationLines.forEach((line, index) => {
        ctx.fillText(line, padding, currentY);
        currentY += (24 * scale); // Line height
      });

      // Date and time (subtitle) - adjust Y position based on number of location lines
      ctx.fillStyle = '#b0c4ce';
      ctx.font = `${14 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      
      // Get date/time text lines
      const dateTimeLines = formatDateTimeText(data.date, data.time);
      
      // Draw each line of date/time text
      dateTimeLines.forEach((line) => {
        ctx.fillText(line, padding, currentY);
        currentY += (18 * scale); // Smaller line height for subtitle
      });

      // ChronoGlobe branding at bottom
      const brandY = height - padding;
      const iconSize = 10 * scale;
      
      // Draw ChronoGlobe logo/icon (globe icon representation)
      ctx.fillStyle = '#4ade80'; // Green accent
      ctx.beginPath();
      ctx.arc(padding + iconSize, brandY - (8 * scale), iconSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Globe lines
      ctx.strokeStyle = '#1a3a4a';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.ellipse(padding + iconSize, brandY - (8 * scale), iconSize, iconSize, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(padding + iconSize, brandY - (8 * scale), iconSize / 2, iconSize, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padding, brandY - (8 * scale));
      ctx.lineTo(padding + (20 * scale), brandY - (8 * scale));
      ctx.stroke();

      // ChronoGlobe text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${16 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText('ChronoGlobe', padding + (28 * scale), brandY - (4 * scale));

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
