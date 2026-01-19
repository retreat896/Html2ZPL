import React, { useEffect } from 'react';
import LabelObject from '../../classes/LabelObject';
import { convertImageToZPL } from '../../utils/imageToZpl';
import { useProject } from '../../context/ProjectContext';
import { convertPixelsToDots } from '../../utils/zplMath';

// --- Logic ---
class ImageObject extends LabelObject {
    constructor(props = {}) {
        super('image', props);
        this.src = props.src || '';
        this.fileId = props.fileId || null;
        this.width = props.width || 100;
        this.height = props.height || 100;
        this.lockAspectRatio = props.lockAspectRatio !== undefined ? props.lockAspectRatio : true;
        this.threshold = props.threshold !== undefined ? props.threshold : 128;

        // ZPL Data Cache
        this.zplData = props.zplData || '';
        this.totalBytes = props.totalBytes || 0;
        this.bytesPerRow = props.bytesPerRow || 0;
    }

    toZPL(index) {
        if (!this.zplData) {
            return `^FX Image Object ID: ${this.id} FileID: ${this.fileId} Z:${index} (No Data)^FS`;
        }

        // ^GFA,totalBytes,totalBytes,bytesPerRow,data
        return `^FX Image Object ID: ${this.id} FileID: ${this.fileId} Z:${index}\n^FO${this.x},${this.y}^GFA,${this.totalBytes},${this.totalBytes},${this.bytesPerRow},${this.zplData}^FS`;
    }

    resize(handle, delta, settings, initialProps) {
        const { dx, dy } = delta;
        const { snapToGrid, gridSize, confineToLabel, bleed = 0, labelDim } = settings;
        const lockAspectRatio = this.lockAspectRatio;
        const aspectRatio = initialProps.width / initialProps.height;

        let newProps = {};
        const minSize = 10;

        // Calculate boundaries
        const minX = -bleed;
        const minY = -bleed;
        const maxX = labelDim ? labelDim.width + bleed : Infinity;
        const maxY = labelDim ? labelDim.height + bleed : Infinity;

        if (handle === 'br') {
            let newWidth = Math.max(minSize, initialProps.width + dx);
            let newHeight = Math.max(minSize, initialProps.height + dy);

            if (lockAspectRatio) {
                // Determine dominant axis
                if (Math.abs(dx) > Math.abs(dy)) {
                    newHeight = newWidth / aspectRatio;
                } else {
                    newWidth = newHeight * aspectRatio;
                }
            }

            if (snapToGrid) {
                newWidth = Math.round(newWidth / gridSize) * gridSize;
                newHeight = Math.round(newHeight / gridSize) * gridSize;

                if (lockAspectRatio) {
                    newHeight = newWidth / aspectRatio;
                }
            }

            // Confinement Logic
            if (confineToLabel) {
                // Max width is distance from x to maxX
                const maxW = Math.max(minSize, maxX - initialProps.x);
                const maxH = Math.max(minSize, maxY - initialProps.y);

                newWidth = Math.min(newWidth, maxW);
                newHeight = Math.min(newHeight, maxH);

                if (lockAspectRatio) {
                    // If we hit width limit, recalc height
                    if (newWidth === maxW) {
                        newHeight = newWidth / aspectRatio;
                    }
                    // If we hit height limit (or recalculated height exceeds it), clamp height and recalc width
                    if (newHeight > maxH) {
                        newHeight = maxH;
                        newWidth = newHeight * aspectRatio;
                    }
                }
            }

            newProps.width = newWidth;
            newProps.height = newHeight;
        } else if (handle === 'tl') {
            const brX = initialProps.x + initialProps.width;
            const brY = initialProps.y + initialProps.height;

            let newX = initialProps.x + dx;
            let newY = initialProps.y + dy;

            // Calculate dimensions based on proposed top-left
            let newWidth = brX - newX;
            let newHeight = brY - newY;

            if (lockAspectRatio) {
                // Determine dominant axis based on movement
                // If moving left (dx < 0), width increases.
                if (Math.abs(dx) > Math.abs(dy)) {
                    newHeight = newWidth / aspectRatio;
                    newY = brY - newHeight;
                } else {
                    newWidth = newHeight * aspectRatio;
                    newX = brX - newWidth;
                }
            }

            if (snapToGrid) {
                newX = Math.round(newX / gridSize) * gridSize;
                newY = Math.round(newY / gridSize) * gridSize;

                // Re-calculate dims
                newWidth = brX - newX;
                newHeight = brY - newY;

                if (lockAspectRatio) {
                    // Snap X, derive Y
                    newHeight = newWidth / aspectRatio;
                    newY = brY - newHeight;
                }
            }

            // Confinement Logic
            if (confineToLabel) {
                if (newX < minX) {
                    newX = minX;
                    newWidth = brX - newX;
                    if (lockAspectRatio) {
                        newHeight = newWidth / aspectRatio;
                        newY = brY - newHeight;
                    }
                }
                if (newY < minY) {
                    newY = minY;
                    newHeight = brY - newY;
                    if (lockAspectRatio) {
                        newWidth = newHeight * aspectRatio;
                        newX = brX - newWidth;
                    }
                }
            }

            // Min size check
            if (newWidth < minSize || newHeight < minSize) {
                return {}; // Cancel resize if too small
            }

            newProps.x = newX;
            newProps.y = newY;
            newProps.width = newWidth;
            newProps.height = newHeight;
        }

        return newProps;
    }
    getProps() {
        return {
            src: this.src,
            fileId: this.fileId,
            width: this.width,
            height: this.height,
            lockAspectRatio: this.lockAspectRatio,
            threshold: this.threshold,
            zplData: this.zplData,
            totalBytes: this.totalBytes,
            bytesPerRow: this.bytesPerRow
        };
    }

    static get properties() {
        return [
            { name: 'lockAspectRatio', type: 'boolean', label: 'Lock Aspect Ratio' },
            { name: 'threshold', type: 'number', label: 'Threshold', min: 0, max: 255 },
            {
                name: 'dimensions',
                type: 'row',
                fields: [
                    { name: 'width', type: 'number', label: 'Width', min: 10 },
                    { name: 'height', type: 'number', label: 'Height', min: 10 },
                ],
            },
        ];
    }
}

// --- Component ---
export const ImageComponent = ({ object }) => {
    const { updateObject, activeLabel } = useProject();

    // Effect to regenerate ZPL data when properties change
    useEffect(() => {
        if (!object.src) return;

        const regenerate = async () => {
            try {
                // Calculate target dimensions in printer dots
                // Default to 8 dpmm if activeLabel is missing (fallback)
                const dpmm = activeLabel?.settings?.dpmm || 8;
                const unit = activeLabel?.settings?.unit || 'inch';
                
                const targetWidth = convertPixelsToDots(object.width, dpmm, unit);
                const targetHeight = convertPixelsToDots(object.height, dpmm, unit);

                const result = await convertImageToZPL(object.src, targetWidth, targetHeight, object.threshold);
                
                // Only update if data changed to avoid loops
                if (result.zplData !== object.zplData) {
                    updateObject(object.id, {
                        zplData: result.zplData,
                        totalBytes: result.totalBytes,
                        bytesPerRow: result.bytesPerRow
                    });
                }
            } catch (err) {
                console.error("Failed to generate ZPL for image:", err);
            }
        };

        // Debounce slightly
        const timeoutId = setTimeout(regenerate, 500);
        return () => clearTimeout(timeoutId);
        
    }, [object.src, object.width, object.height, object.threshold, object.id, activeLabel?.settings?.dpmm, activeLabel?.settings?.unit]); // Dependencies

    return (
        <div 
            className="w-full h-full select-none"
            style={{ 
                width: object.width, 
                height: object.height,
                backgroundImage: `url(${object.src})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                opacity: 0.8 // Visual cue
            }}
        />
    );
};

// --- Definition ---
export default {
    type: 'image',
    name: 'Image',
    icon: 'fa-image',
    class: ImageObject,
    Component: ImageComponent
};
