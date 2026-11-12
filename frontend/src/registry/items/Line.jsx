import React from 'react';
import LabelObject from '../../classes/LabelObject';
import { snap } from '../../utils/resizeUtils';

// Offsets this small snap to a perfectly horizontal/vertical line.
const STRAIGHTEN_THRESHOLD = 3;
const straighten = (value) => (Math.abs(value) <= STRAIGHTEN_THRESHOLD ? 0 : value);

// --- Logic ---
export class LineObject extends LabelObject {
    constructor(props = {}) {
        super('line', props);
        const legacyVertical = props.direction === 'vertical';
        this.lineWidth = props.lineWidth ?? (legacyVertical ? 0 : props.length || 150);
        this.lineHeight = props.lineHeight ?? (legacyVertical ? props.length || 150 : 0);
        this.slope = props.slope || 'down'; // down = "\", up = "/"
        this.thickness = props.thickness || 3;
        this.color = props.color || 'B';
        this.width = props.width || 0;
        this.height = props.height || 0;
    }

    static fromDrag({ start, end }) {
        const dx = straighten(end.x - start.x);
        const dy = straighten(end.y - start.y);
        return {
            x: Math.min(start.x, start.x + dx),
            y: Math.min(start.y, start.y + dy),
            lineWidth: Math.abs(dx),
            lineHeight: Math.abs(dy),
            slope: dx * dy < 0 ? 'up' : 'down',
        };
    }

    toZPL(index) {
        const { lineWidth, lineHeight, thickness, color } = this;
        let command;
        if (lineHeight === 0) {
            command = `^GB${lineWidth},${thickness},${thickness},${color},0`;
        } else if (lineWidth === 0) {
            command = `^GB${thickness},${lineHeight},${thickness},${color},0`;
        } else {
            command = `^GD${lineWidth},${lineHeight},${thickness},${color},${this.slope === 'up' ? 'R' : 'L'}`;
        }
        return `^FX Line Object ID: ${this.id} Z:${index}\n^FO${this.x},${this.y}${command}^FS`;
    }

    getProps() {
        return {
            lineWidth: this.lineWidth,
            lineHeight: this.lineHeight,
            slope: this.slope,
            thickness: this.thickness,
            color: this.color,
        };
    }

    // Handles are the line's endpoints: 'start' is the left end, 'end' the right end.
    static getEndpoints({ x, y, lineWidth, lineHeight, slope }) {
        return slope === 'up'
            ? { start: { x, y: y + lineHeight }, end: { x: x + lineWidth, y } }
            : { start: { x, y }, end: { x: x + lineWidth, y: y + lineHeight } };
    }

    resize(handle, delta, settings, initialProps) {
        const { snapToGrid, gridSize, confineToLabel, bleed, labelDim } = settings;
        const endpoints = LineObject.getEndpoints(initialProps);
        const movingKey = handle === 'start' || handle === 'tl' ? 'start' : 'end';
        const fixed = endpoints[movingKey === 'start' ? 'end' : 'start'];
        let moved = { x: endpoints[movingKey].x + delta.dx, y: endpoints[movingKey].y + delta.dy };

        if (snapToGrid) {
            moved = { x: snap(moved.x, gridSize), y: snap(moved.y, gridSize) };
        }
        if (confineToLabel) {
            moved = {
                x: Math.max(-bleed, Math.min(moved.x, labelDim.width + bleed)),
                y: Math.max(-bleed, Math.min(moved.y, labelDim.height + bleed)),
            };
        }

        const newProps = LineObject.fromDrag({ start: fixed, end: moved });
        if (newProps.lineWidth === 0 && newProps.lineHeight === 0) newProps.lineWidth = 1;

        return {
            ...newProps,
            width: Math.max(newProps.lineWidth, this.thickness),
            height: Math.max(newProps.lineHeight, this.thickness),
        };
    }

    static get properties() {
        return [
            {
                name: 'dimensions',
                type: 'row',
                fields: [
                    { name: 'lineWidth', type: 'number', label: 'Width', min: 0 },
                    { name: 'lineHeight', type: 'number', label: 'Height', min: 0 },
                ],
            },
            {
                name: 'slope',
                type: 'select',
                label: 'Direction',
                options: [
                    { value: 'down', label: 'Down (\\)' },
                    { value: 'up', label: 'Up (/)' },
                ],
                showIf: (obj) => obj.lineWidth > 0 && obj.lineHeight > 0,
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
        ];
    }
}

// --- Component ---
export const LineComponent = ({ object }) => {
    const { lineWidth, lineHeight, thickness, slope } = object;
    const color = object.color === 'W' ? 'white' : 'black';

    if (lineWidth === 0 || lineHeight === 0) {
        return <div style={{ width: `${lineWidth || thickness}px`, height: `${lineHeight || thickness}px`, backgroundColor: color }} />;
    }

    return (
        <svg width={lineWidth} height={lineHeight} viewBox={`0 0 ${lineWidth} ${lineHeight}`} style={{ display: 'block', overflow: 'visible' }}>
            <line x1="0" y1={slope === 'up' ? lineHeight : 0} x2={lineWidth} y2={slope === 'up' ? 0 : lineHeight} stroke={color} strokeWidth={thickness} />
        </svg>
    );
};

// --- Definition ---
export default {
    type: 'line',
    name: 'Line',
    icon: 'fa-minus',
    class: LineObject,
    Component: LineComponent,
};
