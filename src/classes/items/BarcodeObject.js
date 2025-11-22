import LabelObject from '../LabelObject';

export default class BarcodeObject extends LabelObject {
    constructor(props = {}) {
        super('barcode', props);
        this.data = props.data || '12345678';
        this.barcodeType = props.barcodeType || 'code128'; // code128, qrcode, etc.
        this.height = props.height || 100;
        this.width = props.width || 2; // Module width
        this.showText = props.showText !== undefined ? props.showText : true;
    }

    toZPL() {
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

        return `^FX Barcode Object ID: ${this.id}
^FO${this.x},${this.y}${command}${dataField}`;
    }

    getProps() {
        return {
            data: this.data,
            barcodeType: this.barcodeType,
            height: this.height,
            width: this.width,
            showText: this.showText
        };
    }
}
