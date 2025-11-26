import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-pro-image-preview';

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
          aspectRatio: "16:9",
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