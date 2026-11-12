import React from 'react';
import LabelObject from '../../classes/LabelObject';
import { useProject } from '../../context/ProjectContext';
import { ZPL_FONT_0_CAP_HEIGHT } from '../../constants/editor';

const labelFontTransforms = new Map();
// Font 0 strokes match the bold face of the condensed preview font.
const LABEL_FONT_WEIGHT = 700;

// Maps the HTML font's cap top and baseline onto Font 0's within a line-height: 1 box.
const getLabelFontTransform = () => {
    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--theme-label-font').trim() || 'sans-serif';
    if (labelFontTransforms.has(fontFamily)) return labelFontTransforms.get(fontFamily);

    const context = document.createElement('canvas').getContext('2d');
    context.font = `${LABEL_FONT_WEIGHT} 100px ${fontFamily}`;
    const metrics = context.measureText('H');
    const capHeight = metrics.actualBoundingBoxAscent / 100;
    const baseline = ((100 - metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2 + metrics.fontBoundingBoxAscent) / 100;
    const scaleY = capHeight > 0 ? ZPL_FONT_0_CAP_HEIGHT / capHeight : 1;
    const transform = { scaleY, offsetEm: -(baseline - capHeight) * scaleY };

    labelFontTransforms.set(fontFamily, transform);
    return transform;
};

// --- Logic ---
export class TextObject extends LabelObject {
    constructor(props = {}) {
        super('text', props);
        this.text = props.text || 'New Text';
        this.font = props.font || '0'; // ZPL font 0
        this.fontSize = props.fontSize || 30;
        this.orientation = props.orientation || 'N'; // N, R, I, B
        this.width = props.width || 0;
        this.height = props.height || 0;
    }

    static fromDrag({ rect }) {
        return { x: rect.x, y: rect.y, fontSize: Math.max(5, Math.round(rect.height)) };
    }

    toZPL(index, templateValues = {}) {
        // Determine the text content to use
        let content = this.text;

        if (this.isTemplate) {
            // In Fill Mode (or when generating final ZPL), we use the template value
            // passed via templateValues map using the object ID.
            const userValue = templateValues[this.id];

            if (userValue !== undefined) {
                // If the finalInput pattern contains ${value}, replace it.
                // Otherwise fallback to just using the value (simple substitution).
                if (this.finalInput && this.finalInput.includes('${value}')) {
                    content = this.finalInput.replace('${value}', userValue);
                } else {
                    // If no placeholder, assume the whole finalInput IS the content,
                    // but that's rare. Usually, we want the pattern.
                    // If finalInput is empty or just "${value}", we use userValue.
                    content = userValue;
                }
            } else {
                // No value provided? Use preview text or fallback
                content = this.previewText || this.text;
            }
        }

        // ^FOx,y^Afont,orientation,height,width^FDdata^FS
        // Use 0 for width to allow proportional scaling
        return `^FX Text Object ID: ${this.id} Z:${index} W:${this.width} H:${this.height}\n^FO${this.x},${this.y}^A${this.font}${this.orientation},${this.fontSize}^FD${content}^FS`;
    }

    getProps() {
        return {
            text: this.text,
            font: this.font,
            fontSize: this.fontSize,
            orientation: this.orientation,
        };
    }

    resize(handle, delta, settings, initialProps) {
        const { dx, dy } = delta;
        const { snapToGrid, gridSize, confineToLabel, bleed, labelDim } = settings;

        const newProps = {};
        const isVertical = this.orientation === 'R' || this.orientation === 'B';
        const deltaChange = isVertical ? dx : dy;
        const fontSizeDelta = handle === 'br' ? deltaChange : -deltaChange;
        const baseFontSize = Math.max(1, initialProps.fontSize);
        const contentWidth = Math.max(1, initialProps.domWidth);
        const contentHeight = Math.max(1, initialProps.domHeight);

        let newFontSize = Math.max(5, Math.round(initialProps.fontSize + fontSizeDelta));

        // Check confinement
        if (confineToLabel) {
            const getDims = (fs) => {
                const ratio = fs / baseFontSize;
                return { w: contentWidth * ratio, h: contentHeight * ratio };
            };

            let { w: newWidth, h: newHeight } = getDims(newFontSize);

            if (handle === 'br') {
                const maxX = labelDim.width + bleed;
                const maxY = labelDim.height + bleed;

                // Check Width
                if (initialProps.x + newWidth > maxX) {
                    const maxW = maxX - initialProps.x;
                    const maxRatio = Math.max(0, maxW) / contentWidth;
                    newFontSize = Math.floor(baseFontSize * maxRatio);
                    ({ w: newWidth, h: newHeight } = getDims(newFontSize));
                }

                // Check Height
                if (initialProps.y + newHeight > maxY) {
                    const maxH = maxY - initialProps.y;
                    const maxRatio = Math.max(0, maxH) / contentHeight;
                    newFontSize = Math.min(newFontSize, Math.floor(baseFontSize * maxRatio));
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
                    const maxRatio = Math.max(0, maxW) / contentWidth;
                    newFontSize = Math.floor(baseFontSize * maxRatio);
                    ({ w: newWidth, h: newHeight } = getDims(newFontSize));
                    newX = brX - newWidth;
                    newY = brY - newHeight;
                }

                // Check Top
                if (newY < minY) {
                    const maxH = brY - minY;
                    const maxRatio = Math.max(0, maxH) / contentHeight;
                    newFontSize = Math.min(newFontSize, Math.floor(baseFontSize * maxRatio));
                    ({ w: newWidth, h: newHeight } = getDims(newFontSize));
                    newX = brX - newWidth;
                    newY = brY - newHeight;
                }

                newProps.x = newX;
                newProps.y = newY;
            }
        } else {
            if (handle === 'tl') {
                const ratio = newFontSize / baseFontSize;
                const newWidth = contentWidth * ratio;
                const newHeight = contentHeight * ratio;

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
            {
                name: 'isTemplate',
                type: 'boolean',
                label: 'Is Template',
            },
            {
                name: 'fieldLabel',
                type: 'text',
                label: 'Field Label (Description)',
                showIf: (obj) => obj.isTemplate,
            },
            {
                name: 'previewText',
                type: 'text',
                label: 'Preview Input',
                showIf: (obj) => obj.isTemplate,
            },
            {
                name: 'finalInput',
                type: 'text',
                label: 'Final Input Pattern (use ${value})',
                showIf: (obj) => obj.isTemplate,
            },
            { name: 'text', type: 'text', label: 'Default Text', showIf: (obj) => !obj.isTemplate },
            { name: 'fontSize', type: 'number', label: 'Font Size', min: 5, step: 1 },
            {
                name: 'orientation',
                type: 'select',
                label: 'Orientation',
                options: [
                    { value: 'N', label: 'Normal' },
                    { value: 'R', label: 'Rotated 90' },
                    { value: 'I', label: 'Inverted 180' },
                    { value: 'B', label: 'Bottom Up 270' },
                ],
            },
        ];
    }
}

// --- Component ---
export const TextComponent = ({ object }) => {
    const { interactionMode, templateValues } = useProject();

    // Determine what to display
    // - Design Mode: Use previewText if template, else text
    // - Fill Mode: Use templateValue if template (fallback to previewText/text), else text

    let displayText = object.text;

    if (object.isTemplate) {
        if (interactionMode === 'fill') {
            const userValue = templateValues[object.id];
            if (userValue !== undefined && userValue !== '') {
                // In fill mode, we just show what the user typed.
                // We do NOT show the complex substitution pattern (finalInput) here normally,
                // unless the user wants to see the raw code, but usually they want to see "Banana",
                // not "^FD...Banana...^FS"
                displayText = userValue;
            } else {
                // Fallback to preview text to show "what goes here"
                displayText = object.previewText || object.text;
            }
        } else {
            // Design Mode
            displayText = object.previewText || object.text;
        }
    }

    const { scaleY, offsetEm } = getLabelFontTransform();

    return (
        <span className="text-black whitespace-nowrap select-none inline-block leading-none align-top" style={{ fontFamily: 'var(--theme-label-font)', fontWeight: LABEL_FONT_WEIGHT, fontSize: `${object.fontSize}px`, letterSpacing: 'var(--zpl-letter-spacing, 0em)', marginRight: 'calc(-1 * var(--zpl-letter-spacing, 0em))', transform: `translateY(${offsetEm}em) scaleY(${scaleY})`, transformOrigin: 'top left' }}>
            {displayText}
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
