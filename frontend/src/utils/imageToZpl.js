/**
 * Converts an image data URL to ZPL ^GFA command data.
 * @param {string} dataUrl - The image data URL.
 * @param {number} width - Target width in dots (optional, defaults to image width).
 * @param {number} height - Target height in dots (optional, defaults to image height).
 * @param {number} threshold - Binarization threshold (0-255).
 * @returns {Promise<object>} - { zplData, binaryData, width, height, bytesPerRow, totalBytes }
 */
export const convertImageToZPL = (dataUrl, width, height, threshold = 128) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Use provided dimensions or image natural dimensions
            const targetWidth = width || img.width;
            const targetHeight = height || img.height;
            
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            const ctx = canvas.getContext('2d');
            // Fill white background (for transparency)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const data = imageData.data;
            
            let hexString = '';
            let binaryString = '';
            
            const bytesPerRow = Math.ceil(targetWidth / 8);
            const totalBytes = bytesPerRow * targetHeight;
            
            for (let y = 0; y < targetHeight; y++) {
                let rowByte = 0;
                let bitsInByte = 0;
                
                for (let x = 0; x < targetWidth; x++) {
                    const idx = (y * targetWidth + x) * 4;
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];
                    // const a = data[idx + 3]; // Ignore alpha, assumed white background
                    
                    // Luminance
                    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                    const isBlack = luminance < threshold;
                    
                    // ZPL: 1 is black, 0 is white
                    if (isBlack) {
                        rowByte |= (1 << (7 - bitsInByte));
                    }
                    
                    bitsInByte++;
                    
                    if (bitsInByte === 8) {
                        hexString += rowByte.toString(16).padStart(2, '0').toUpperCase();
                        rowByte = 0;
                        bitsInByte = 0;
                    }
                }
                
                // Pad remaining bits in the last byte of the row
                if (bitsInByte > 0) {
                    hexString += rowByte.toString(16).padStart(2, '0').toUpperCase();
                }
                
                // ZPL doesn't strictly require newline per row in data, but it helps debugging
                // hexString += '\n'; 
            }
            
            resolve({
                zplData: hexString,
                width: targetWidth,
                height: targetHeight,
                bytesPerRow,
                totalBytes
            });
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
};
