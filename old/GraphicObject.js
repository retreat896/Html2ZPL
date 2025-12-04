import LabelObject from '../LabelObject';
import { snap } from '../../utils/resizeUtils';

export default class GraphicObject extends LabelObject {
    constructor(props = {}) {
        super('graphic', props);
        this.shape = props.shape || 'box'; // box, circle, line, ellipse
        this.width = props.width || 100;
        this.height = props.height || 100;
        this.thickness = props.thickness || 1;
        this.color = props.color || 'B'; // B=Black, W=White
    }

    toZPL() {
        let command = '';
        console.log("the shape is: " + this.shape);
        switch (this.shape) {
            case 'box':
                // ^GBw,h,t,c,r
                command = `^GB${this.width},${this.height},${this.thickness},${this.color},0`;
                break;
            case 'circle':
                // ^GCd,t,c
                command = `^GC${this.width},${this.thickness},${this.color}`;
                break;
            case 'line':
                // ^GDw,h,t,c,o
                // Diagonal line, but often used for simple lines too if h or w is 0
                command = `^GD${this.width},${this.height},${this.thickness},${this.color},L`;
                break;
            case 'ellipse':
                // ^GEw,h,t,c
                command = `^GE${this.width},${this.height},${this.thickness},${this.color}`;
                break;
            default:
                command = `^GB${this.width},${this.height},${this.thickness},${this.color},0`;
        }

        return `^FX Graphic Object ID: ${this.id}\n^FO${this.x},${this.y}${command}^FS`;
    }

    getProps() {
        return {
            shape: this.shape,
            width: this.width,
            height: this.height,
            thickness: this.thickness,
            color: this.color
        };
    }

    resize(handle, delta, settings, initialProps) {
        const { dx, dy } = delta;
        const { snapToGrid, gridSize, confineToLabel, bleed, labelDim } = settings;

        let newProps = {};

        // Calculate new dimensions based on handle
        let newWidth = initialProps.width;
        let newHeight = initialProps.height;
        let newX = initialProps.x;
        let newY = initialProps.y;

        if (handle === 'br') {
            newWidth = Math.max(10, initialProps.width + dx);
            newHeight = Math.max(10, initialProps.height + dy);
        } else if (handle === 'tl') {
            newWidth = Math.max(10, initialProps.width - dx);
            newHeight = Math.max(10, initialProps.height - dy);

            // For TL, we also need to update position
            // But position update depends on the actual size change (after constraints)
            // So we calculate desired X/Y based on the desired width/height change
        }

        // Enforce 1:1 aspect ratio for circles
        if (this.shape === 'circle') {
            const size = Math.max(newWidth, newHeight);
            newWidth = size;
            newHeight = size;
        }

        // Confinement Logic
        if (confineToLabel) {
            const minX = -bleed;
            const minY = -bleed;
            const maxX = labelDim.width + bleed;
            const maxY = labelDim.height + bleed;

            if (handle === 'br') {
                // Constrain Width
                if (initialProps.x + newWidth > maxX) {
                    newWidth = maxX - initialProps.x;
                }
                // Constrain Height
                if (initialProps.y + newHeight > maxY) {
                    newHeight = maxY - initialProps.y;
                }

                // Re-enforce aspect ratio if it was clamped
                if (this.shape === 'circle') {
                    const size = Math.min(newWidth, newHeight);
                    newWidth = size;
                    newHeight = size;
                }

            } else if (handle === 'tl') {
                // Calculate potential new X/Y
                // newX = initialProps.x + (initialProps.width - newWidth)
                // We need to ensure newX >= minX and newY >= minY

                // It's easier to think about the Bottom-Right point being fixed for TL resize
                const brX = initialProps.x + initialProps.width;
                const brY = initialProps.y + initialProps.height;

                // Check Left constraint
                if (brX - newWidth < minX) {
                    newWidth = brX - minX;
                }
                // Check Top constraint
                if (brY - newHeight < minY) {
                    newHeight = brY - minY;
                }

                // Re-enforce aspect ratio
                if (this.shape === 'circle') {
                    const size = Math.min(newWidth, newHeight);
                    newWidth = size;
                    newHeight = size;
                }

                newX = brX - newWidth;
                newY = brY - newHeight;
            }
        } else {
            // Unconfined TL position update
            if (handle === 'tl') {
                const brX = initialProps.x + initialProps.width;
                const brY = initialProps.y + initialProps.height;
                newX = brX - newWidth;
                newY = brY - newHeight;
            }
        }

        // Grid Snapping
        if (snapToGrid) {
            if (handle === 'tl') {
                // Snap position
                newX = snap(newX, gridSize);
                newY = snap(newY, gridSize);

                // Recalculate size based on snapped position to maintain BR anchor
                const brX = initialProps.x + initialProps.width;
                const brY = initialProps.y + initialProps.height;

                newWidth = brX - newX;
                newHeight = brY - newY;
            } else {
                // For BR, we snap the width/height directly (or the resulting BR coordinate)
                // Let's snap the resulting width/height to grid multiples? 
                // Or snap the resulting BR coordinate?
                // TextObject doesn't seem to snap BR explicitly in the snippet, but let's snap dimensions
                // Actually, snapping dimensions is safer for graphics
                newWidth = snap(newWidth, gridSize);
                newHeight = snap(newHeight, gridSize);
            }

            // Re-enforce circle constraint after snapping
            if (this.shape === 'circle') {
                // If we snapped, they might be different again
                const size = Math.max(newWidth, newHeight);
                newWidth = size;
                newHeight = size;

                // If TL, we need to adjust X/Y again if size changed
                if (handle === 'tl') {
                    const brX = initialProps.x + initialProps.width;
                    const brY = initialProps.y + initialProps.height;
                    newX = brX - newWidth;
                    newY = brY - newHeight;
                }
            }
        }

        // Final Minimum Size Check
        newWidth = Math.max(10, newWidth);
        newHeight = Math.max(10, newHeight);

        if (this.shape === 'circle') {
            newWidth = Math.max(newWidth, newHeight);
            newHeight = newWidth;
            if (handle === 'tl') {
                const brX = initialProps.x + initialProps.width;
                const brY = initialProps.y + initialProps.height;
                newX = brX - newWidth;
                newY = brY - newHeight;
            }
        }

        newProps.width = newWidth;
        newProps.height = newHeight;

        if (handle === 'tl') {
            newProps.x = newX;
            newProps.y = newY;
        }

        return newProps;
    }
}
