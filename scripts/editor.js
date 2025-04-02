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

//item on dblClick bdltap
$(function () {
    //create 5 labels by default
    for (let i = 0; i < 2; i++) {
        let label = new Label(labelLayer, userLabelConfig);
        label.addToLayer();
    }
});

function addItem(config) {
    if (!config) {
        console.error('[Editor.js - addItem()] : No Item Config provided');
        return;
    }
    let label = document.getElementsByClassName('innerKonvacanvas')[0];
    let item1 = new Item(config);
    label.getLayer('items').add(item1);
}

function reOrderLabels() {
    let labelsPerRow = userLabelConfig.labelsPerRow ?? 5;
    let padding = userLabelConfig.labelPadding ?? 10;
    let labelWidth = userLabelConfig.width;
    let labelHeight = userLabelConfig.height;

    if (!labelLayer) {
        console.error('LabelLayer not found!');
        return;
    }

    let labels = labelLayer.find('Rect'); // Get all label rects
    console.log(labels.length + ' labels found.');

    labels.forEach((label, index) => {
        console.log('Reordering label ' + index);
        let columnIndex = index % labelsPerRow;
        let rowIndex = Math.floor(index / labelsPerRow);

        let newX = columnIndex * (labelWidth + padding);
        let newY = rowIndex * (labelHeight + padding);

        label.to({
            x: newX,
            y: newY,
            duration: 0.3, // Smooth animation
            easing: Konva.Easings.EaseInOut,
        });
    });

    labelLayer.draw(); // Redraw layer
}

class Label {
    static count = 0; // Static counter for label IDs
    static id;
    static label;

    constructor(layer, config) {
        if (!layer || !config) {
            console.error('[Label] : Missing required parameters (layer, config)');
            return;
        }
        this.config = config;

        let labelsPerRow = userLabelConfig.labelsPerRow ?? 5;
        let padding = userLabelConfig.labelPadding ?? 10;
        let columnIndex = Label.count % labelsPerRow;
        let rowIndex = Math.floor(Label.count / labelsPerRow);

        let x = columnIndex * (this.config.width + padding);
        let y = rowIndex * (this.config.height + padding);

        this.config.x = x;
        this.config.y = y;
        this.layer = layer;
        this.id = `Label${++Label.count}`;
        let label = new Konva.Rect({
            x: this.config.x,
            y: this.config.y,
            width: this.config.width || userLabelConfig.width,
            height: this.config.height || userLabelConfig.height,
            fill: this.config.labelBackgroundColor || userLabelConfig.labelBackgroundColor,
            stroke: this.config.labelBorderColor,
            draggable: false,
            id: this.id,
        });
        this.label = label;
    }

    addToLayer() {
        this.layer.add(this.label);
        this.layer.draw();
    }

    removeLabel() {
        this.label?.destroy();
        console.log(`[Label] : Removed ${this.id}`);
    }

    //getters
    getLabel() {
        if (!this.label) return console.error('[Label] : Label not found');
        return this.label;
    }

    getId() {
        return this.id;
    }

    //setters

    //methods
    makeDraggable() {
        if (!this.label) return console.error('[Label] : Label not found');
        this.label.on('dragmove', () => {
            let position = this.label.position();
            this.config.x = position.x;
            this.config.y = position.y;
            console.log(`[Label] : ${this.id} moved to (${position.x}, ${position.y})`);
        });

        this.label.draggable(true);
    }
}

class Item {
    constructor(config) {
        if (!config) {
            console.error('[Editor.js - item.constructor()] : No Item Config provided');
            return;
        }

        this.config = config;
        this.type = this.config.type;
        this.x = this.config.x;
        this.y = this.config.y;
        this.width = this.config.width;
        this.height = this.config.height;
        try {
            this.Item = itemTypes.getItem(type, subtype);
        } catch (e) {
            console.error('[Editor.js - item.constructor()] : ' + e);
        }
    }

    get() {
        return this.Item;
    }

    edit(config) {
        if (!config) {
            console.warn('[Editor.js - item.edit()] : No Item Config provided');
            return this.Item;
        }
        for (let key in config) {
            if (config.hasOwnProperty(key)) {
                if (key in this.config) {
                    try {
                        this.config[key] = config[key];
                        this[key] = config[key];
                    } catch (e) {
                        console.error('[Editor.js - item.edit()] : ' + e);
                    }
                }
            }
        }
        return this.Item;
    }

    remove() {
        try {
            this.Item.destroy();
        } catch (e) {
            console.error('[Editor.js - item.remove()] : ' + e);
        }
    }

    getX() {
        return this.x;
    }
    getY() {
        return this.y;
    }
    getWidth() {
        return this.width;
    }
    getHeight() {
        return this.height;
    }
    getType() {
        return this.type;
    }
    getConfig() {
        return this.config;
    }
}

class itemTypes {
    static getItem(type, subtype, config) {
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
                        console.log('Graphic Box.');
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
                console.log('Unsupported or non-visual ZPL command type.');
        }
    }
}
