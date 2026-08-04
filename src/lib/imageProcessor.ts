/**
 * Utility for standardizing uploaded farm images to 1152 x 1536 (3:4 portrait aspect ratio)
 * using intelligent center-cropping and high quality JPEG encoding.
 */

export interface ProcessedImageResult {
  file: File;
  previewUrl: string;
  originalWidth: number;
  originalHeight: number;
  targetWidth: number;
  targetHeight: number;
}

export const TARGET_WIDTH = 1152;
export const TARGET_HEIGHT = 1536;
export const TARGET_ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT; // 0.75 (3:4)

/**
 * Process an image file or HTMLImageElement:
 * - Resizes to 1152 x 1536 pixels
 * - Maintains 3:4 portrait aspect ratio
 * - Intelligent center cropping without distortion
 * - Saves as JPEG with 96% quality
 */
export async function processFarmImage(
  source: File | Blob | string,
  fileName?: string
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;
        const sourceRatio = originalWidth / originalHeight;

        let cropWidth = originalWidth;
        let cropHeight = originalHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (sourceRatio > TARGET_ASPECT_RATIO) {
          // Source is wider than 3:4, crop sides evenly from center
          cropHeight = originalHeight;
          cropWidth = originalHeight * TARGET_ASPECT_RATIO;
          offsetX = (originalWidth - cropWidth) / 2;
          offsetY = 0;
        } else if (sourceRatio < TARGET_ASPECT_RATIO) {
          // Source is taller than 3:4, crop top/bottom evenly from center
          cropWidth = originalWidth;
          cropHeight = originalWidth / TARGET_ASPECT_RATIO;
          offsetX = 0;
          offsetY = (originalHeight - cropHeight) / 2;
        }

        // Create canvas with exact dimensions 1152 x 1536
        const canvas = document.createElement('canvas');
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context non-available'));
          return;
        }

        // High quality smoothing settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw center-cropped portion of original image onto 1152x1536 canvas
        ctx.drawImage(
          img,
          offsetX,
          offsetY,
          cropWidth,
          cropHeight,
          0,
          0,
          TARGET_WIDTH,
          TARGET_HEIGHT
        );

        // Export as high-quality JPEG (96% quality)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }

            let name = fileName || (source instanceof File ? source.name : 'farm_image.jpg');
            // Ensure filename ends with .jpg or .jpeg
            const baseName = name.replace(/\.[^/.]+$/, '');
            const finalFileName = `${baseName}.jpg`;

            const processedFile = new File([blob], finalFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: processedFile,
              previewUrl,
              originalWidth,
              originalHeight,
              targetWidth: TARGET_WIDTH,
              targetHeight: TARGET_HEIGHT,
            });
          },
          'image/jpeg',
          0.96
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error('Failed to load image for processing: ' + err));
    };

    if (source instanceof File || source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
}

export interface ProcessedProfileImageResult {
  file: File;
  previewUrl: string;
  originalWidth: number;
  originalHeight: number;
  targetWidth: number;
  targetHeight: number;
}

/**
 * Process a profile image:
 * - Accepts any aspect ratio (square, portrait, landscape)
 * - Does NOT crop or stretch the image
 * - Resizes max dimension down to 1000px for optimal loading speed while keeping high quality
 * - Saves as JPEG with 90% quality
 */
export async function processProfileImage(
  source: File | Blob | string,
  fileName?: string
): Promise<ProcessedProfileImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;

        const MAX_DIM = 1000;
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        if (originalWidth > MAX_DIM || originalHeight > MAX_DIM) {
          if (originalWidth >= originalHeight) {
            targetWidth = MAX_DIM;
            targetHeight = Math.round((originalHeight * MAX_DIM) / originalWidth);
          } else {
            targetHeight = MAX_DIM;
            targetWidth = Math.round((originalWidth * MAX_DIM) / originalHeight);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw entire source image onto target canvas (no cropping or stretching!)
        ctx.drawImage(
          img,
          0,
          0,
          originalWidth,
          originalHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress profile image'));
              return;
            }

            const name = fileName || (source instanceof File ? source.name : 'profile_image.jpg');
            const baseName = name.replace(/\.[^/.]+$/, '');
            const finalFileName = `${baseName}_opt.jpg`;

            const processedFile = new File([blob], finalFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: processedFile,
              previewUrl,
              originalWidth,
              originalHeight,
              targetWidth,
              targetHeight,
            });
          },
          'image/jpeg',
          0.90
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error('Failed to load image for processing: ' + err));
    };

    if (source instanceof File || source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
}

