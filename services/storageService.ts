import { GeneratedImageResult, Coordinates, DateSelection } from '../types';

/**
 * Storage Service - Handles persistent storage of generated images using IndexedDB
 * Keeps the last 20 images automatically
 */

const DB_NAME = 'chronoglobe-db';
const DB_VERSION = 1;
const STORE_NAME = 'generated-images';
const MAX_IMAGES = 20;

interface StoredImage {
  id: number;
  imageUrl: string;
  prompt: string;
  location?: Coordinates;
  date?: DateSelection;
  time?: string;
  locationName?: string;
  conflictData?: any;
  createdAt: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize and get the IndexedDB database instance
 */
const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        // Create index for sorting by creation time
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

/**
 * Save a generated image to storage
 * Automatically removes oldest images if over MAX_IMAGES limit
 */
export const saveGeneratedImage = async (
  result: GeneratedImageResult,
  location?: Coordinates,
  date?: DateSelection,
  time?: string
): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Create the stored image object
    const storedImage: Omit<StoredImage, 'id'> = {
      imageUrl: result.imageUrl || '',
      prompt: result.prompt,
      location: location || result.location,
      date: date || result.date,
      time: time || result.time,
      locationName: result.locationName,
      conflictData: result.conflictData,
      createdAt: Date.now()
    };

    // Add the new image
    store.add(storedImage);

    // Wait for transaction to complete
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    // Clean up old images if over limit
    await enforceMaxImages();
  } catch (error) {
    console.error('Failed to save image to storage:', error);
    // Don't throw - storage failure shouldn't break the app
  }
};

/**
 * Load all stored images from IndexedDB
 * Returns images sorted by creation time (newest first)
 */
export const loadStoredImages = async (): Promise<GeneratedImageResult[]> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('createdAt');

    return new Promise((resolve, reject) => {
      const request = index.getAll();

      request.onsuccess = () => {
        const storedImages: StoredImage[] = request.result || [];
        
        // Convert to GeneratedImageResult format and sort newest first
        const images: GeneratedImageResult[] = storedImages
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(stored => ({
            imageUrl: stored.imageUrl,
            prompt: stored.prompt,
            location: stored.location,
            date: stored.date,
            time: stored.time,
            locationName: stored.locationName,
            conflictData: stored.conflictData
          }));

        resolve(images);
      };

      request.onerror = () => {
        console.error('Failed to load images:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to load stored images:', error);
    return []; // Return empty array on failure
  }
};

/**
 * Remove oldest images if we have more than MAX_IMAGES
 */
const enforceMaxImages = async (): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('createdAt');

    // Get all images sorted by creation time (oldest first)
    const request = index.getAll();

    request.onsuccess = () => {
      const images: StoredImage[] = request.result || [];
      
      // If we have more than MAX_IMAGES, delete the oldest ones
      if (images.length > MAX_IMAGES) {
        const imagesToDelete = images
          .sort((a, b) => a.createdAt - b.createdAt) // oldest first
          .slice(0, images.length - MAX_IMAGES);

        imagesToDelete.forEach(img => {
          store.delete(img.id);
        });
      }
    };
  } catch (error) {
    console.error('Failed to enforce max images:', error);
  }
};

/**
 * Clear all stored images
 */
export const clearStoredImages = async (): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to clear stored images:', error);
  }
};

/**
 * Delete a specific image by matching its imageUrl
 */
export const deleteStoredImage = async (imageUrl: string): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      const images: StoredImage[] = request.result || [];
      const imageToDelete = images.find(img => img.imageUrl === imageUrl);
      
      if (imageToDelete) {
        store.delete(imageToDelete.id);
      }
    };
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
};

/**
 * Check if IndexedDB is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    return 'indexedDB' in window && indexedDB !== null;
  } catch {
    return false;
  }
};
