"""
Gemini API Module
Handles all interactions with the Google Gemini API for image generation.
"""

import os
import uuid
import mimetypes
from typing import Optional
from google import genai
from google.genai import types


class GeminiImageGenerator:
    """Client for generating images using Gemini API."""
    
    def __init__(self, api_key: Optional[str] = None, output_dir: str = "generated_images"):
        """
        Initialize the Gemini image generator.
        
        Args:
            api_key: Gemini API key. If None, will try to get from environment.
            output_dir: Directory to save generated images.
        """
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.output_dir = output_dir
        self.model = "gemini-3-pro-image-preview"
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
    
    def is_configured(self) -> bool:
        """Check if the API key is properly configured."""
        return bool(self.api_key and self.api_key != "your_gemini_api_key_here")
    
    def generate_image(self, prompt: str) -> dict:
        """
        Generate an image from a text prompt.
        
        Args:
            prompt: The text prompt for image generation.
            
        Returns:
            dict with keys:
                - prompt: The original prompt
                - images: List of generated image info (url, mime_type)
                - text: Any text response from the model
                - error: Error message if failed
        """
        if not self.is_configured():
            return {
                "error": "GEMINI_API_KEY not configured. Please add your API key to the .env file."
            }
        
        try:
            client = genai.Client(api_key=self.api_key)
            
            contents = [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt)],
                ),
            ]
            
            config = types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
                image_config=types.ImageConfig(
                    aspect_ratio="3:4",
                    image_size="1K",
                ),
            )
            
            result = {
                "prompt": prompt,
                "images": [],
                "text": ""
            }
            
            # Stream the response
            for chunk in client.models.generate_content_stream(
                model=self.model,
                contents=contents,
                config=config,
            ):
                if not self._is_valid_chunk(chunk):
                    continue
                
                part = chunk.candidates[0].content.parts[0]
                
                if self._has_image_data(part):
                    image_info = self._save_image(part.inline_data)
                    result["images"].append(image_info)
                elif hasattr(chunk, 'text') and chunk.text:
                    result["text"] += chunk.text
            
            return result
            
        except Exception as e:
            return {"error": str(e)}
    
    def _is_valid_chunk(self, chunk) -> bool:
        """Check if a response chunk contains valid content."""
        return (
            chunk.candidates is not None
            and chunk.candidates[0].content is not None
            and chunk.candidates[0].content.parts is not None
        )
    
    def _has_image_data(self, part) -> bool:
        """Check if a part contains image data."""
        return (
            part.inline_data 
            and part.inline_data.data
        )
    
    def _save_image(self, inline_data) -> dict:
        """
        Save image data to file and return info.
        
        Args:
            inline_data: The inline data from the API response.
            
        Returns:
            dict with url and mime_type
        """
        file_extension = mimetypes.guess_extension(inline_data.mime_type) or ".png"
        file_name = f"geohistory_{uuid.uuid4().hex[:8]}{file_extension}"
        file_path = os.path.join(self.output_dir, file_name)
        
        with open(file_path, "wb") as f:
            f.write(inline_data.data)
        
        return {
            "url": f"/images/{file_name}",
            "mime_type": inline_data.mime_type
        }
