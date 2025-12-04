import React from 'react';
import LabelObject from '../../classes/LabelObject';
import { TEXT_PADDING_W, TEXT_PADDING_H, DISPLAY_DPI } from '../../constants/editor';

// --- Logic ---
class TextObject extends LabelObject {
    constructor(props = {}) {
        super('text', props);
        this.text = props.text || 'New Text';
        this.font = props.font || '0'; // ZPL font 0
        this.fontSize = props.fontSize || 30;
        this.orientation = props.orientation || 'N'; // N, R, I, B
    }

    toZPL() {
        // ^FOx,y^Afont,orientation,height,width^FDdata^FS
        // Use 0 for width to allow proportional scaling
        return `^FX Text Object ID: ${this.id}\n^FO${this.x},${this.y}^A${this.font}${this.orientation},${this.fontSize}^FD${this.text}^FS`;
    }

    getProps() {
        return {
            text: this.text,
            font: this.font,
            fontSize: this.fontSize,
            orientation: this.orientation
        };
    }

    resize(handle, delta, settings, initialProps) {
        const { dx, dy } = delta;
        const { snapToGrid, gridSize, confineToLabel, bleed, labelDim } = settings;
        
        let newProps = {};
        let scaleFactor = 1;

        const PAD_W = 0; 
        const PAD_H = 0;

        // Calculate content dimensions (without padding)
        const contentWidth = Math.max(1, initialProps.domWidth - PAD_W);
        const contentHeight = Math.max(1, initialProps.domHeight - PAD_H);

        // Calculate scale factor based on handle movement and orientation
        const isVertical = this.orientation === 'R' || this.orientation === 'B';
        const dimension = isVertical ? initialProps.domWidth : initialProps.domHeight;
        const deltaChange = isVertical ? dx : dy;

        if (handle === 'br') {
            scaleFactor = (dimension + deltaChange) / dimension;
        } else if (handle === 'tl') {
            scaleFactor = (dimension - deltaChange) / dimension;
        }

        // Calculate proposed font size
        let newFontSize = Math.max(5, initialProps.fontSize * scaleFactor);
        newFontSize = Math.round(newFontSize);

        // Check confinement
        if (confineToLabel) {
            const getDims = (fs) => {
                const ratio = fs / initialProps.fontSize;
                return {
                    w: (contentWidth * ratio) + PAD_W,
                    h: (contentHeight * ratio) + PAD_H
                };
            };

            let { w: newWidth, h: newHeight } = getDims(newFontSize);

            if (handle === 'br') {
                const maxX = labelDim.width + bleed;
                const maxY = labelDim.height + bleed;
                
                // Check Width
                if (initialProps.x + newWidth > maxX) {
                    const maxW = maxX - initialProps.x;
                    const maxRatio = Math.max(0, maxW - PAD_W) / contentWidth;
                    newFontSize = Math.floor(initialProps.fontSize * maxRatio);
                    ({ w: newWidth, h: newHeight } = getDims(newFontSize));
                }
                
                // Check Height
                if (initialProps.y + newHeight > maxY) {
                    const maxH = maxY - initialProps.y;
                    const maxRatio = Math.max(0, maxH - PAD_H) / contentHeight;
                    newFontSize = Math.min(newFontSize, Math.floor(initialProps.fontSize * maxRatio));
                }

            } else if (handle === 'tl') {
                const minX = -bleed;
                const minY = -bleed;
                
                const brX = initialProps.x + initialProps.domWidth;
                const brY = initialProps.y + initialProps.domHeight;
                
                let newX = brX - newWidth;
                let newY = brY - newHeight;

                // Check Left
                if (newX < minX) {
                    const maxW = brX - minX;
                    const maxRatio = Math.max(0, maxW - PAD_W) / contentWidth;
                    newFontSize = Math.floor(initialProps.fontSize * maxRatio);
                    ({ w: newWidth, h: newHeight } = getDims(newFontSize));
                    newX = brX - newWidth;
                    newY = brY - newHeight;
                }

                // Check Top
                if (newY < minY) {
                    const maxH = brY - minY;
                    const maxRatio = Math.max(0, maxH - PAD_H) / contentHeight;
                    newFontSize = Math.min(newFontSize, Math.floor(initialProps.fontSize * maxRatio));
                    ({ w: newWidth, h: newHeight } = getDims(newFontSize));
                    newX = brX - newWidth;
                    newY = brY - newHeight;
                }
                
                newProps.x = newX;
                newProps.y = newY;
            }
        } else {
            if (handle === 'tl') {
                const ratio = newFontSize / initialProps.fontSize;
                const newWidth = (contentWidth * ratio) + PAD_W;
                const newHeight = (contentHeight * ratio) + PAD_H;
                
                const brX = initialProps.x + initialProps.domWidth;
                const brY = initialProps.y + initialProps.domHeight;
                
                newProps.x = brX - newWidth;
                newProps.y = brY - newHeight;
            }
        }
        
        newProps.fontSize = Math.max(5, newFontSize);
        
        // Grid snapping for TL position
        if (handle === 'tl' && snapToGrid && newProps.x !== undefined) {
             const snap = (val, grid) => Math.round(val / grid) * grid;
             newProps.x = snap(newProps.x, gridSize);
             newProps.y = snap(newProps.y, gridSize);
        }

        return newProps;
    }

    static get properties() {
        return [
            { name: 'text', type: 'text', label: 'Text' },
            { name: 'fontSize', type: 'number', label: 'Font Size', min: 5, step: 1 },
            { 
                name: 'orientation', 
                type: 'select', 
                label: 'Orientation', 
                options: [
                    { value: 'N', label: 'Normal' },
                    { value: 'R', label: 'Rotated 90' },
                    { value: 'I', label: 'Inverted 180' },
                    { value: 'B', label: 'Bottom Up 270' }
                ] 
            }
        ];
    }
}

// --- Component ---
export const TextComponent = ({ object }) => {
    return (
        <span 
            className="text-black whitespace-nowrap select-none inline-block leading-none" 
            style={{ fontSize: object.fontSize }}
        >
            {object.text}
        </span>
    );
};

// --- Definition ---
export default {
    type: 'text',
    name: 'Text',
    icon: 'fa-font',
    class: TextObject,
    Component: TextComponent
};
