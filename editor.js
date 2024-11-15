/**
 * TODO:
 * [ ] [Dynamic item creation](https://github.com/retreat896/Html2ZPL/issues/16)
 * [ ] [Multiple items](https://github.com/retreat896/Html2ZPL/issues/17)
  * [ ] [Implement item list rendering](https://github.com/retreat896/Html2ZPL/issues/18)
  * [ ] [Handle item selection and focus](https://github.com/retreat896/Html2ZPL/issues/19)
 * [ ] [Add and remove items](https://github.com/retreat896/Html2ZPL/issues/20)
  * [ ] [Implement item addition](https://github.com/retreat896/Html2ZPL/issues/21)
  * [ ] [Implement item removal](https://github.com/retreat896/Html2ZPL/issues/22)
  * [ ] [Handle item deletion confirmation](https://github.com/retreat896/Html2ZPL/issues/23)
 */

class label {

}

class item {

    constructor(config) {
        if(!config) {
            console.error('[Editor.js - item.constructor()] : No Object Config provided');
            return;
        }
        
        this.config = config;
        this.type = itemTypes.getItemType(this.config.type);
        this.x = this.config.x;
        this.y = this.config.y;
        this.width = this.config.width;
        this.height = this.config.height;
        try {
            this.Object = new Konva[type]({
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
            });
        } catch (e) {
            console.error("[Editor.js - item.constructor()] : " + e);
        }

    }

    get() {
        return this.Object;
    }

    edit(config) {
        if (!config) {
            console.warn('[Editor.js - item.edit()] : No Object Config provided');
            return this.Object;
        }

        this.x = config.x ?? this.x;
        this.y = config.y ?? this.y;
        this.width = config.width ?? this.width;
        this.height = config.height ?? this.height;
        try {
            this.Object.x(this.x);
            this.Object.y(this.y);
            this.Object.width(this.width);
            this.Object.height(this.height);
        }
        catch (e) {
            console.error("[Editor.js - item.edit()] : " + e);
        }
        return this.Object;
    }

    remove() {
        try {
            this.Object.destroy();
        }
        catch (e) {
            console.error("[Editor.js - item.remove()] : " + e);
        }
    }


}

class itemTypes {

    static getItemType(type) {
        switch (type) {
            case "1dBarcode":
                switch (subtype) {
                    case "code11":
                        console.log("Code 11 Bar Code.");
                        break;
                    case "interleaved2of5":
                        console.log("Interleaved 2 of 5 Bar Code.");
                        break;
                    case "code39":
                        console.log("Code 39 Bar Code.");
                        break;
                    case "code49":
                        console.log("Code 49 Bar Code.");
                        break;
                    case "planetCode":
                        console.log("Planet Code Bar Code.");
                        break;
                    case "ean8":
                        console.log("EAN-8 Bar Code.");
                        break;
                    case "upcE":
                        console.log("UPC-E Bar Code.");
                        break;
                    case "code93":
                        console.log("Code 93 Bar Code.");
                        break;
                    case "codablock":
                        console.log("CODABLOCK Bar Code.");
                        break;
                    case "code128":
                        console.log("Code 128 Bar Code.");
                        break;
                    case "industrial2of5":
                        console.log("Industrial 2 of 5 Bar Code.");
                        break;
                    case "standard2of5":
                        console.log("Standard 2 of 5 Bar Code.");
                        break;
                    case "ansiCodabar":
                        console.log("ANSI Codabar Bar Code.");
                        break;
                    case "logmars":
                        console.log("LOGMARS Bar Code.");
                        break;
                    case "msi":
                        console.log("MSI Bar Code.");
                        break;
                    case "plessey":
                        console.log("Plessey Bar Code.");
                        break;
                    case "upcA":
                        console.log("UPC-A Bar Code.");
                        break;
                    default:
                        console.log("Unknown 1D barcode subtype.");
                }
                break;
            case "2dBarcode":
                switch (subtype) {
                    case "aztec":
                        console.log("Aztec Bar Code.");
                        break;
                    case "pdf417":
                        console.log("PDF417 Bar Code.");
                        break;
                    case "microPDF417":
                        console.log("MicroPDF417 Bar Code.");
                        break;
                    case "qrCode":
                        console.log("QR Code Bar Code.");
                        break;
                    case "gs1Databar":
                        console.log("GS1 Databar.");
                        break;
                    case "dataMatrix":
                        console.log("Data Matrix Bar Code.");
                        break;
                    case "postal":
                        console.log("POSTAL Bar Code.");
                        break;
                    default:
                        console.log("Unknown 2D barcode subtype.");
                }
                break;
            case "graphic":
                switch (subtype) {
                    case "box":
                        console.log("Graphic Box.");
                        break;
                    case "circle":
                        console.log("Graphic Circle.");
                        break;
                    case "diagonalLine":
                        console.log("Graphic Diagonal Line.");
                        break;
                    case "ellipse":
                        console.log("Graphic Ellipse.");
                        break;
                    case "field":
                        console.log("Graphic Field.");
                        break;
                    case "symbol":
                        console.log("Graphic Symbol.");
                        break;
                    default:
                        console.log("Unknown graphic subtype.");
                }
                break;
            default:
                console.log("Unsupported or non-visual ZPL command type.");
        }
    }


}


