/**
 * Image compression utilities for handling large image uploads
 */

/**
 * Calculate the size of a base64 encoded image in KB
 */
export function getImageSizeInKB(base64String: string): number {
  // Base64 encoding increases size by ~33%, so we need to account for that
  // Also remove data URL prefix if present
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  const sizeInBytes = (base64Data.length * 3) / 4;
  return sizeInBytes / 1024;
}

/**
 * Compress an image using Canvas API
 * @param base64Image - Base64 encoded image string (with or without data URL prefix)
 * @param targetFormat - Target format ('image/jpeg' or 'image/png')
 * @param quality - Compression quality (0-1)
 * @returns Promise with compressed base64 image (without data URL prefix)
 */
export async function compressImage(
  base64Image: string,
  targetFormat: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0);
      
      // Convert to target format with quality
      const compressedDataUrl = canvas.toDataURL(targetFormat, quality);
      
      // Remove data URL prefix and return only base64 data
      const base64Data = compressedDataUrl.split(',')[1];
      resolve(base64Data);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Add data URL prefix if not present
    const dataUrl = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/png;base64,${base64Image}`;
    
    img.src = dataUrl;
  });
}

/**
 * Convert PNG to JPG and compress to target size
 * Uses adaptive quality adjustment to reach target size
 * @param base64Png - Base64 encoded PNG image (without data URL prefix)
 * @param targetSizeKB - Target size in KB (default: 200)
 * @returns Promise with compressed JPG base64 (without data URL prefix)
 */
export async function convertPngToJpg(
  base64Png: string,
  targetSizeKB: number = 200
): Promise<string> {
  let minQuality = 0.1;
  let maxQuality = 0.95;
  let quality = 0.85;
  let compressedImage = '';
  let iterations = 0;
  const maxIterations = 10;
  
  // Binary search for optimal quality
  while (iterations < maxIterations) {
    compressedImage = await compressImage(base64Png, 'image/jpeg', quality);
    const sizeKB = getImageSizeInKB(compressedImage);
    
    // If size is within acceptable range (target ± 10KB), we're done
    if (sizeKB <= targetSizeKB && sizeKB >= targetSizeKB - 10) {
      break;
    }
    
    // If still too large, reduce quality
    if (sizeKB > targetSizeKB) {
      maxQuality = quality;
      quality = (minQuality + quality) / 2;
    } else {
      // If too small, we can increase quality slightly
      minQuality = quality;
      quality = (quality + maxQuality) / 2;
    }
    
    iterations++;
    
    // If we've converged or quality is too low, stop
    if (maxQuality - minQuality < 0.01 || quality < 0.1) {
      break;
    }
  }
  
  // Final check - if still too large, use minimum quality
  if (getImageSizeInKB(compressedImage) > targetSizeKB) {
    compressedImage = await compressImage(base64Png, 'image/jpeg', 0.1);
  }
  
  return compressedImage;
}

/**
 * Check if JPG needs compression and compress if necessary
 * @param base64Jpg - Base64 encoded JPG image (without data URL prefix)
 * @param targetSizeKB - Target size in KB (default: 250)
 * @returns Promise with compressed JPG base64 (without data URL prefix)
 */
export async function compressJpgToTarget(
  base64Jpg: string,
  targetSizeKB: number = 250
): Promise<string> {
  let minQuality = 0.1;
  let maxQuality = 0.95;
  let quality = 0.85;
  let compressedImage = '';
  let iterations = 0;
  const maxIterations = 10;
  
  // Binary search for optimal quality
  while (iterations < maxIterations) {
    compressedImage = await compressImage(base64Jpg, 'image/jpeg', quality);
    const sizeKB = getImageSizeInKB(compressedImage);
    
    // If size is within acceptable range (target ± 10KB), we're done
    if (sizeKB <= targetSizeKB && sizeKB >= targetSizeKB - 10) {
      break;
    }
    
    // If still too large, reduce quality
    if (sizeKB > targetSizeKB) {
      maxQuality = quality;
      quality = (minQuality + quality) / 2;
    } else {
      // If too small, we can increase quality slightly
      minQuality = quality;
      quality = (quality + maxQuality) / 2;
    }
    
    iterations++;
    
    // If we've converged or quality is too low, stop
    if (maxQuality - minQuality < 0.01 || quality < 0.1) {
      break;
    }
  }
  
  // Final check - if still too large, use minimum quality
  if (getImageSizeInKB(compressedImage) > targetSizeKB) {
    compressedImage = await compressImage(base64Jpg, 'image/jpeg', 0.1);
  }
  
  return compressedImage;
}

/**
 * Check if an image needs compression based on its size
 * @param base64Image - Base64 encoded image (without data URL prefix)
 * @param thresholdKB - Size threshold in KB
 * @returns true if image exceeds threshold
 */
export function needsCompression(base64Image: string, thresholdKB: number): boolean {
  const sizeKB = getImageSizeInKB(base64Image);
  return sizeKB > thresholdKB;
}

