import React from 'react';
import LabelObject from '../../classes/LabelObject';
import CommonProperties from '../../components/CommonProperties';
import { calculateNewDimensions } from '../../utils/resizeUtils';

// --- Logic ---
export class GraphicObject extends LabelObject {
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

    toZPL() {
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

        return `^FO${this.x},${this.y}${command}^FS`;
    }

    getProps() {
        return {
            shape: this.shape,
            width: this.width,
            height: this.height,
            thickness: this.thickness,
            color: this.color,
            rounding: this.rounding,
            lineOrientation: this.lineOrientation
        };
    }

    resize(handle, delta, settings, initialProps) {
        return calculateNewDimensions({ handle, delta, settings, initialProps });
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
        // ZPL rounding is 0-8, where 8 is fully rounded (circle-ish ends).
        // Approximate mapping: 8 -> 50% of min dimension? Or just some px.
        // ZPL manual says degree of corner-rounding: 0 (no rounding) to 8 (heaviest rounding).
        // Let's just map 1-8 to some borderRadius.
        if (rounding > 0) {
            style.borderRadius = `${rounding * 4}px`; 
        }
    }

    if (shape === 'circle') {
        style.borderRadius = '50%';
    }

    if (shape === 'ellipse') {
        style.borderRadius = '50%';
    }

    if (shape === 'line') {
        // Render a diagonal line using SVG
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

// --- Properties ---
export const GraphicProperties = ({ object, onChange }) => {
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Type</label>
                <div className="text-sm text-gray-900 dark:text-white capitalize">{object.type}</div>
            </div>

            <CommonProperties object={object} onChange={onChange} />
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Shape</label>
                    <select
                        value={object.shape || 'box'}
                        onChange={(e) => onChange('shape', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="box">Box</option>
                        <option value="circle">Circle</option>
                        <option value="ellipse">Ellipse</option>
                        <option value="line">Diagonal Line</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Width</label>
                        <input 
                            type="number" 
                            value={object.width}
                            onChange={(e) => onChange('width', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Height</label>
                        <input 
                            type="number" 
                            value={object.height}
                            onChange={(e) => onChange('height', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Thickness</label>
                    <input 
                        type="number" 
                        value={object.thickness}
                        onChange={(e) => onChange('thickness', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
                
                 <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Color</label>
                    <select
                        value={object.color || 'B'}
                        onChange={(e) => onChange('color', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="B">Black</option>
                        <option value="W">White</option>
                    </select>
                </div>

                {/* Conditional Properties */}
                {object.shape === 'box' && (
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Rounding (0-8)</label>
                        <input 
                            type="number" 
                            min="0"
                            max="8"
                            value={object.rounding || 0}
                            onChange={(e) => onChange('rounding', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                )}

                {object.shape === 'line' && (
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Line Orientation</label>
                        <select
                            value={object.lineOrientation || 'L'}
                            onChange={(e) => onChange('lineOrientation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="L">Left (Top-Left to Bottom-Right)</option>
                            <option value="R">Right (Top-Right to Bottom-Left)</option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Definition ---
export default {
    type: 'graphic',
    name: 'Graphic',
    icon: 'fa-shapes',
    class: GraphicObject,
    Component: GraphicComponent,
    Properties: GraphicProperties
};
