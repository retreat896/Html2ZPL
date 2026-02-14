import { zplToBase64Async } from 'zpl-renderer-js';

/**
 * Generates small and large thumbnails from ZPL code.
 * @param {string} zpl - The ZPL code to render.
 * @param {object} settings - Label settings (width, height, unit, dpmm).
 * @returns {Promise<{thumbnailSmall: string, thumbnailLarge: string}>} - Base64 PNG strings.
 */
export const generateThumbnails = async (zpl, settings) => {
    if (!zpl || !settings) return { thumbnailSmall: null, thumbnailLarge: null };

    try {
        const { width, height, unit, dpmm } = settings;

        // Convert to mm for renderer
        const widthMm = unit === 'inch' ? width * 25.4 : width;
        const heightMm = unit === 'inch' ? height * 25.4 : height;

        // Render base image (using a reasonable dpmm for detailed source, e.g. 8 or 12)
        // We use the project's dpmm or default to 8 (203dpi)
        const renderDpmm = dpmm || 8;

        // zplToBase64Async returns a raw base64 string (no data:image/png;base64 prefix)
        const rawBase64 = await zplToBase64Async(zpl, widthMm, heightMm, renderDpmm);
        const sourceUrl = `data:image/png;base64,${rawBase64}`;

        // Create an Image object to draw on canvas for resizing
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = sourceUrl;
        });

        // Define target widths
        const SMALL_WIDTH = 300;
        const LARGE_WIDTH = 800;

        const smallParams = calculateDimensions(img.width, img.height, SMALL_WIDTH);
        const largeParams = calculateDimensions(img.width, img.height, LARGE_WIDTH);

        const thumbnailSmall = resizeImage(img, smallParams.width, smallParams.height);
        const thumbnailLarge = resizeImage(img, largeParams.width, largeParams.height);

        return { thumbnailSmall, thumbnailLarge };
    } catch (error) {
        console.error('Failed to generate thumbnails:', error);
        return { thumbnailSmall: null, thumbnailLarge: null };
    }
};

const calculateDimensions = (srcWidth, srcHeight, targetWidth) => {
    if (srcWidth <= targetWidth) return { width: srcWidth, height: srcHeight };
    const ratio = srcHeight / srcWidth;
    return { width: targetWidth, height: Math.round(targetWidth * ratio) };
};

const resizeImage = (img, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Use better interpolation if available (browser dependent, but good practice)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/png');
};
