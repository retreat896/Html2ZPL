import React from 'react';
import LabelObject from '../../classes/LabelObject';
import { useProject } from '../../context/ProjectContext';
import { convertDotsToPixels, convertPixelsToDots } from '../../utils/zplMath';

const LINEAR_TYPES = ['code128', 'code39'];
const isLinear = (type) => LINEAR_TYPES.includes(type);

// --- Logic ---
export class BarcodeObject extends LabelObject {
    constructor(props = {}) {
        super('barcode', props);
        this.data = props.data || '12345678';
        this.barcodeType = props.barcodeType || 'code128';
        // Older saves stored module width in `width` and bar height in `height`.
        this.moduleWidth = props.moduleWidth || (props.width > 0 && props.width <= 10 ? props.width : 2);
        this.barHeight = props.barHeight || (props.moduleWidth === undefined && props.height ? props.height : 60);
        this.showText = props.showText !== undefined ? props.showText : true;
        this.width = props.width || 0;
        this.height = props.height || 0;
    }

    static fromDrag({ rect, labelSettings }) {
        const defaults = new BarcodeObject({ moduleWidth: 1 });
        const { dpmm = 8, unit = 'inch' } = labelSettings || {};
        const modules = estimateSizeInDots(defaults).width;
        const moduleWidth = Math.min(10, Math.max(1, Math.round(convertPixelsToDots(rect.width, dpmm, unit) / modules)));
        const textHeight = convertDotsToPixels(30, dpmm, unit);
        return { x: rect.x, y: rect.y, moduleWidth, barHeight: Math.max(10, Math.round(rect.height - textHeight)) };
    }

    toZPL(index) {
        const text = this.showText ? 'Y' : 'N';
        const size = Math.min(10, Math.max(1, Math.round(this.moduleWidth)));
        let command;
        let data = this.data;

        switch (this.barcodeType) {
            case 'code39':
                command = `^BY${size}^B3N,N,${this.barHeight},${text},N`;
                break;
            case 'qrcode':
                command = `^BQN,2,${size}`;
                data = `QA,${this.data}`;
                break;
            case 'datamatrix':
                command = `^BXN,${size},200`;
                break;
            default:
                command = `^BY${size}^BCN,${this.barHeight},${text},N,N`;
        }

        return `^FX Barcode Object ID: ${this.id} Z:${index} W:${this.width} H:${this.height}\n^FO${this.x},${this.y}${command}^FD${data}^FS`;
    }

    getProps() {
        return {
            data: this.data,
            barcodeType: this.barcodeType,
            moduleWidth: this.moduleWidth,
            barHeight: this.barHeight,
            showText: this.showText,
        };
    }

    resize(handle, delta, settings, initialProps) {
        const { dx, dy } = delta;
        const sign = handle === 'br' ? 1 : -1;
        const baseWidth = Math.max(1, initialProps.domWidth);
        const baseModule = Math.max(1, initialProps.moduleWidth || 1);
        const newProps = {};

        if (isLinear(this.barcodeType)) {
            newProps.moduleWidth = Math.min(10, Math.max(1, Math.round((baseModule * (baseWidth + sign * dx)) / baseWidth)));
            newProps.barHeight = Math.max(10, Math.round(initialProps.barHeight + sign * dy));
            newProps.width = (baseWidth * newProps.moduleWidth) / baseModule;
            newProps.height = initialProps.domHeight + (newProps.barHeight - initialProps.barHeight);
        } else {
            const growth = Math.abs(dx) > Math.abs(dy) ? dx : dy;
            newProps.moduleWidth = Math.min(10, Math.max(1, Math.round((baseModule * (baseWidth + sign * growth)) / baseWidth)));
            newProps.width = (baseWidth * newProps.moduleWidth) / baseModule;
            newProps.height = (initialProps.domHeight * newProps.moduleWidth) / baseModule;
        }

        if (handle === 'tl') {
            newProps.x = initialProps.x + initialProps.domWidth - newProps.width;
            newProps.y = initialProps.y + initialProps.domHeight - newProps.height;
        }

        return newProps;
    }

    static get properties() {
        return [
            { name: 'data', type: 'text', label: 'Data' },
            {
                name: 'barcodeType',
                type: 'select',
                label: 'Type',
                options: [
                    { value: 'code128', label: 'Code 128' },
                    { value: 'code39', label: 'Code 39' },
                    { value: 'qrcode', label: 'QR Code' },
                    { value: 'datamatrix', label: 'Data Matrix' },
                ],
            },
            {
                name: 'dimensions',
                type: 'row',
                fields: [
                    { name: 'moduleWidth', type: 'number', label: 'Module (dots)', min: 1, max: 10, step: 1 },
                    { name: 'barHeight', type: 'number', label: 'Bar Height', min: 1, showIf: (obj) => isLinear(obj.barcodeType) },
                ],
            },
            { name: 'showText', type: 'boolean', label: 'Show Human-Readable Text', showIf: (obj) => isLinear(obj.barcodeType) },
        ];
    }
}

// Rough size in dots, used until the ZPL render provides an exact snapshot.
const estimateSizeInDots = ({ barcodeType, data = '', moduleWidth, barHeight, showText }) => {
    const module = Math.max(1, moduleWidth || 1);
    const length = String(data).length;
    switch (barcodeType) {
        case 'qrcode': {
            const side = (21 + 4 * Math.min(10, Math.ceil(length / 20))) * module;
            return { width: side, height: side };
        }
        case 'datamatrix': {
            const side = (10 + 2 * Math.ceil(length / 3)) * module;
            return { width: side, height: side };
        }
        default: {
            const modules = barcodeType === 'code39' ? (length + 2) * 16 : 11 * (length + 3) + 2;
            return { width: modules * module, height: barHeight + (showText ? 30 : 0) };
        }
    }
};

// --- Component ---
export const BarcodeComponent = ({ object, snapshot }) => {
    const { activeLabel } = useProject();

    if (snapshot?.src) {
        const scale = object.moduleWidth / (snapshot.moduleWidth || object.moduleWidth || 1);
        const width = snapshot.width * scale;
        const height = isLinear(object.barcodeType) ? snapshot.height + (object.barHeight - snapshot.barHeight) : snapshot.height * scale;
        return <img src={snapshot.src} alt="" draggable={false} className="block select-none pointer-events-none" style={{ width, height, imageRendering: 'pixelated' }} />;
    }

    const { dpmm = 8, unit = 'inch' } = activeLabel?.settings || {};
    const estimate = estimateSizeInDots(object);
    const width = convertDotsToPixels(estimate.width, dpmm, unit);
    const height = isLinear(object.barcodeType) ? object.barHeight + (object.showText ? convertDotsToPixels(30, dpmm, unit) : 0) : convertDotsToPixels(estimate.height, dpmm, unit);

    return (
        <div
            className="select-none"
            style={{
                width,
                height,
                backgroundImage: isLinear(object.barcodeType)
                    ? 'repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 4px, #000 4px 5px, transparent 5px 8px)'
                    : 'repeating-conic-gradient(#000 0 25%, transparent 0 50%)',
                backgroundSize: isLinear(object.barcodeType) ? 'auto' : '8px 8px',
                opacity: 0.35,
            }}
        />
    );
};

// --- Definition ---
export default {
    type: 'barcode',
    name: 'Barcode',
    icon: 'fa-barcode',
    class: BarcodeObject,
    Component: BarcodeComponent,
};
