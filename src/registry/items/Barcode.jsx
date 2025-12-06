import React from 'react';
import LabelObject from '../../classes/LabelObject';

// --- Logic ---
export class BarcodeObject extends LabelObject {
    constructor(props = {}) {
        super('barcode', props);
        this.data = props.data || '12345678';
        this.barcodeType = props.barcodeType || 'code128'; // code128, qrcode, etc.
        this.height = props.height || 100;
        this.width = props.width || 2; // Module width
        this.showText = props.showText !== undefined ? props.showText : true;
    }

    toZPL(index) {
        let command = '';

        switch (this.barcodeType) {
            case 'code128':
                // ^BCo,h,f,g,e,m
                command = `^BCN,${this.height},Y,N,N`;
                break;
            case 'qrcode':
                // ^BQa,b,c,d,e
                // QR codes usually need ^FDQA,data^FS
                command = `^BQN,2,${this.width}`;
                break;
            default:
                command = `^BCN,${this.height},Y,N,N`;
        }

        const dataField = this.barcodeType === 'qrcode' ? `^FDQA,${this.data}^FS` : `^FD${this.data}^FS`;

        return `^FX Barcode Object ID: ${this.id} Z:${index} W:${this.width} H:${this.height}\n^FO${this.x},${this.y}${command}${dataField}`;
    }

    getProps() {
        return {
            data: this.data,
            barcodeType: this.barcodeType,
            height: this.height,
            width: this.width,
            showText: this.showText,
        };
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
                    { value: 'qrcode', label: 'QR Code' },
                ],
            },
            {
                name: 'dimensions',
                type: 'row',
                fields: [
                    { name: 'width', type: 'number', label: 'Mod Width', min: 1 },
                    { name: 'height', type: 'number', label: 'Height', min: 1 },
                ],
            },
        ];
    }
}

// --- Component ---
export const BarcodeComponent = ({ object }) => {
    // Placeholder rendering for editor
    return (
        <div className="flex flex-col items-center justify-center border border-gray-400 bg-gray-100 p-2 select-none"
             style={{ height: object.height, minWidth: 100 }}>
            <span className="text-xs font-mono mb-1">{object.barcodeType}</span>
            <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                ||| || |||
            </div>
            <span className="text-xs mt-1">{object.data}</span>
        </div>
    );
};

// --- Definition ---
export default {
    type: 'barcode',
    name: 'Barcode',
    icon: 'fa-barcode',
    class: BarcodeObject,
    Component: BarcodeComponent
};
