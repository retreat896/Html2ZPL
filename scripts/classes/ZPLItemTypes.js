export default class ItemTypes {
    constructor(type, subtype, config) {
        this.item = null;
        switch (type) {
            case '1dBarcode':
                switch (subtype) {
                    case 'code11':
                        console.log('Code 11 Bar Code.');
                        break;
                    case 'interleaved2of5':
                        console.log('Interleaved 2 of 5 Bar Code.');
                        break;
                    case 'code39':
                        console.log('Code 39 Bar Code.');
                        break;
                    case 'code49':
                        console.log('Code 49 Bar Code.');
                        break;
                    case 'planetCode':
                        console.log('Planet Code Bar Code.');
                        break;
                    case 'ean8':
                        console.log('EAN-8 Bar Code.');
                        break;
                    case 'upcE':
                        console.log('UPC-E Bar Code.');
                        break;
                    case 'code93':
                        console.log('Code 93 Bar Code.');
                        break;
                    case 'codablock':
                        console.log('CODABLOCK Bar Code.');
                        break;
                    case 'code128':
                        console.log('Code 128 Bar Code.');
                        break;
                    case 'industrial2of5':
                        console.log('Industrial 2 of 5 Bar Code.');
                        break;
                    case 'standard2of5':
                        console.log('Standard 2 of 5 Bar Code.');
                        break;
                    case 'ansiCodabar':
                        console.log('ANSI Codabar Bar Code.');
                        break;
                    case 'logmars':
                        console.log('LOGMARS Bar Code.');
                        break;
                    case 'msi':
                        console.log('MSI Bar Code.');
                        break;
                    case 'plessey':
                        console.log('Plessey Bar Code.');
                        break;
                    case 'upcA':
                        console.log('UPC-A Bar Code.');
                        break;
                    default:
                        console.log('Unknown 1D barcode subtype.');
                }
                break;
            case '2dBarcode':
                switch (subtype) {
                    case 'aztec':
                        console.log('Aztec Bar Code.');
                        break;
                    case 'pdf417':
                        console.log('PDF417 Bar Code.');
                        break;
                    case 'microPDF417':
                        console.log('MicroPDF417 Bar Code.');
                        break;
                    case 'qrCode':
                        console.log('QR Code Bar Code.');
                        break;
                    case 'gs1Databar':
                        console.log('GS1 Databar.');
                        break;
                    case 'dataMatrix':
                        console.log('Data Matrix Bar Code.');
                        break;
                    case 'postal':
                        console.log('POSTAL Bar Code.');
                        break;
                    default:
                        console.log('Unknown 2D barcode subtype.');
                }
                break;
            case 'graphic':
                switch (subtype) {
                    case 'box':
                        console.log('Item "Graphic Box", Created');
                            this.config = {
                                x: config.x || 0,
                                y: config.y || 0,
                                width: config.width || 200,
                                height: config.height || 50,
                                fill: config.fill || '#fff',
                                stroke: config.stroke || '#000',
                                draggable: true,
                            };

                            this.shadowConfig = {
                                ...this.config,
                                fill: '#848484ff',
                                stroke: null,
                                draggable: false,
                            }

                            this.shadow = new Konva.Rect(this.shadowConfig)
                            this.item = new Konva.Rect(this.config);
                        break;
                    case 'circle':
                        console.log('Graphic Circle.');
                        break;
                    case 'diagonalLine':
                        console.log('Graphic Diagonal Line.');
                        break;
                    case 'ellipse':
                        console.log('Graphic Ellipse.');
                        break;
                    case 'field':
                        console.log('Graphic Field.');
                        break;
                    case 'symbol':
                        console.log('Graphic Symbol.');
                        break;
                    default:
                        console.log('Unknown graphic subtype.');
                }
                break;
            default:
                console.log('Unsupported or non-visual ZPL command type. ' + type, subtype);
        }
    }

    getItem() {
        return this.item;
    }
    
    getShadow() {
        return this.shadow;
    }

    getConfig() {
        return this.config;
    }

    getShadowConfig() {
        return this.shadowConfig
    }
}
