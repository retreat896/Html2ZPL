import React from 'react';
import LabelObject from '../../classes/LabelObject';
import { snap } from '../../utils/resizeUtils';

// --- Logic ---
class GraphicObject extends LabelObject {
    constructor(props = {}) {
        super('graphic', props);
        this.shape = props.shape || 'box'; // box, circle, line, ellipse
        this.width = props.width || 100;
        this.height = props.height || 100;
        this.thickness = props.thickness || 1;
        this.color = props.color || 'B'; // B=Black, W=White
        this.rounding = props.rounding || 0; // 0-8, for box
        this.lineOrientation = props.lineOrientation || 'L'; // L=Left, R=Right, for line
    }

    toZPL(index) {
        let command = '';

        switch (this.shape) {
            case 'box':
                // ^GBw,h,t,c,r
                command = `^GB${this.width},${this.height},${this.thickness},${this.color},${this.rounding}`;
                break;
            case 'circle':
                // ^GCd,t,c
                command = `^GC${this.width},${this.thickness},${this.color}`;
                break;
            case 'ellipse':
                // ^GEw,h,t,c
                command = `^GE${this.width},${this.height},${this.thickness},${this.color}`;
                break;
            case 'line':
                // ^GDw,h,t,c,o
                command = `^GD${this.width},${this.height},${this.thickness},${this.color},${this.lineOrientation}`;
                break;
            default:
                command = `^GB${this.width},${this.height},${this.thickness},${this.color},0`;
        }

        return `^FX Graphic Object ID: ${this.id} Z:${index}\n^FO${this.x},${this.y}${command}^FS`;
    }

    getProps() {
        return {
            shape: this.shape,
            width: this.width,
            height: this.height,
            thickness: this.thickness,
            color: this.color,
            rounding: this.rounding,
            lineOrientation: this.lineOrientation,
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
                newWidth = snap(newWidth, gridSize);
                newHeight = snap(newHeight, gridSize);
            }

            // Re-enforce circle constraint after snapping
            if (this.shape === 'circle') {
                const size = Math.max(newWidth, newHeight);
                newWidth = size;
                newHeight = size;

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

    static get properties() {
        return [
            {
                name: 'shape',
                type: 'select',
                label: 'Shape',
                options: [
                    { value: 'box', label: 'Box' },
                    { value: 'circle', label: 'Circle' },
                    { value: 'ellipse', label: 'Ellipse' },
                    { value: 'line', label: 'Diagonal Line' },
                ],
            },
            {
                name: 'dimensions',
                type: 'row',
                fields: [
                    { name: 'width', type: 'number', label: 'Width', min: 1 },
                    { name: 'height', type: 'number', label: 'Height', min: 1 },
                ],
            },
            { name: 'thickness', type: 'number', label: 'Thickness', min: 1 },
            {
                name: 'color',
                type: 'select',
                label: 'Color',
                options: [
                    { value: 'B', label: 'Black' },
                    { value: 'W', label: 'White' },
                ],
            },
            {
                name: 'rounding',
                type: 'number',
                label: 'Rounding (0-8)',
                min: 0,
                max: 8,
                showIf: (obj) => obj.shape === 'box',
            },
            {
                name: 'lineOrientation',
                type: 'select',
                label: 'Line Orientation',
                options: [
                    { value: 'L', label: 'Left (TL-BR)' },
                    { value: 'R', label: 'Right (TR-BL)' },
                ],
                showIf: (obj) => obj.shape === 'line',
            },
        ];
    }
}

// --- Component ---
export const GraphicComponent = ({ object }) => {
    const { shape, width, height, thickness, color, rounding, lineOrientation } = object;
    const borderColor = color === 'W' ? 'white' : 'black';
    
    const style = {
        width: `${width}px`,
        height: `${height}px`,
        border: `${thickness}px solid ${borderColor}`,
        boxSizing: 'border-box',
    };

    if (shape === 'box') {
        if (rounding > 0) {
            style.borderRadius = `${rounding * 4}px`; 
        }
    }

    if (shape === 'circle' || shape === 'ellipse') {
        style.borderRadius = '50%';
    }

    if (shape === 'line') {
        return (
            <div style={{ width: `${width}px`, height: `${height}px` }}>
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                    <line 
                        x1={lineOrientation === 'R' ? width : 0} 
                        y1="0" 
                        x2={lineOrientation === 'R' ? 0 : width} 
                        y2={height} 
                        stroke={borderColor} 
                        strokeWidth={thickness} 
                    />
                </svg>
            </div>
        );
    }

    return <div style={style} />;
};

// --- Definition ---
export default {
    type: 'graphic',
    name: 'Graphic',
    icon: 'fa-shapes',
    class: GraphicObject,
    Component: GraphicComponent
};
