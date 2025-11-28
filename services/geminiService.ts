import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-pro-image-preview';

export type ImageGenerationData = {
  // For user-placed pins with time travel controls
  location?: {
    lat: number;
    lng: number;
  };
  date?: {
    year: number;
    month: number;
    day: number;
    era: 'CE' | 'BCE';
  };
  time?: string;
} | {
  // For conflicts/events from JSON data
  conflictData: {
    name?: string;
    place?: string;
    country?: string;
    year?: number | string;
    context?: string;
    lat?: number;
    lng?: number;
  };
};

/**
 * Checks if the user has selected a paid API key for Veo/Imagen models.
 */
export const checkApiKeySelection = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return true; // Fallback if not running in the specific studio environment, assuming env var is set.
};

/**
 * Opens the dialog for the user to select an API key.
 */
export const requestApiKeySelection = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  }
};

/**
 * Constructs an intelligent prompt based on the input data type.
 */
export const constructIntelligentPrompt = (data: ImageGenerationData): string => {
  // Check if it's conflict/event data
  if ('conflictData' in data) {
    const conflictData = data.conflictData;
    const placeName = conflictData.place || conflictData.name || 'Unknown location';
    const country = conflictData.country || '';
    const year = conflictData.year || 'unknown time';
    const context = conflictData.context || '';
    
    // Include coordinates if available for more precise location
    let locationInfo = placeName;
    if (country) {
      locationInfo += `, ${country}`;
    }
    if (conflictData.lat && conflictData.lng) {
      const latStr = `${Math.abs(conflictData.lat).toFixed(4)}° ${conflictData.lat >= 0 ? 'N' : 'S'}`;
      const lngStr = `${Math.abs(conflictData.lng).toFixed(4)}° ${conflictData.lng >= 0 ? 'E' : 'W'}`;
      locationInfo += ` (${latStr}, ${lngStr})`;
    }
    
    let prompt = `Create a photorealistic image of ${locationInfo} during ${year}`;
    
    if (context) {
      prompt += `, during the ${context}`;
    }
    
    // Detect if this is a conflict/war-related event
    const isConflict = context && (
      context.toLowerCase().includes('war') || 
      context.toLowerCase().includes('battle') || 
      context.toLowerCase().includes('conflict') || 
      context.toLowerCase().includes('invasion') || 
      context.toLowerCase().includes('revolution') ||
      conflictData.name && (
        conflictData.name.toLowerCase().includes('battle') ||
        conflictData.name.toLowerCase().includes('siege') ||
        conflictData.name.toLowerCase().includes('war')
      )
    );
    
    if (isConflict) {
      prompt += `. Create a documentary-style image that captures the gravity and human impact of this conflict. Show the strategic location, military elements, and atmospheric conditions that convey the historical significance. Use realistic lighting and composition typical of historical documentation.`;
    } else {
      prompt += `. Create a documentary-style image that authentically represents this historical moment. Draw upon historical knowledge to show the cultural, technological, and environmental context of the era, including appropriate architecture, clothing, and daily life elements.`;
    }
    
    prompt += ` Focus on educational accuracy and the genuine feel of the time period. Photorealistic, high quality, detailed.`;
    
    return prompt;
  }
  
  // Otherwise, it's user-placed pin data
  const { location, date, time } = data;
  if (!location || !date || !time) {
    throw new Error('Missing required data for image generation');
  }
  
  const latStr = `${Math.abs(location.lat).toFixed(4)}° ${location.lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(location.lng).toFixed(4)}° ${location.lng >= 0 ? 'E' : 'W'}`;
  const dateStr = `${date.month}/${date.day}/${date.year} ${date.era}`;
  
  return `Create a documentary-style image at ${latStr}, ${lngStr}, ${dateStr}, ${time} hours. Draw upon historical knowledge to authentically depict the location and era, showing the architecture, environment, and cultural elements that would have been present. Focus on educational accuracy and the genuine atmosphere of the time period. Photorealistic, high quality, detailed.`;
};

/**
 * Generates an image based on intelligent data analysis.
 */
export const generateImageFromData = async (data: ImageGenerationData): Promise<{ imageUrl: string; prompt: string }> => {
  const prompt = constructIntelligentPrompt(data);
  const imageUrl = await generateImageFromPrompt(prompt);
  return { imageUrl, prompt };
};

/**
 * Generates an image based on the location and time prompt.
 */
export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  // Always create a new instance to pick up potentially newly selected keys
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: "1K"
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    
    throw new Error("No image data found in response.");

  } catch (error: any) {
    // Handle the specific "Requested entity was not found" error for API keys
    if (error.message && error.message.includes("Requested entity was not found")) {
      throw new Error("API_KEY_MISSING");
    }
    console.error("Gemini API Error:", error);
    throw error;
  }
};