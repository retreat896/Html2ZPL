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

    render() {
        this.layer.add(this.label);
        this.reOrderLabels();
        this.layer.draw();
    }

    remove() {
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

    reOrderLabels() {
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
}

class Item {
    constructor(config) {
        if (!config) {
            console.error('[Editor.js - item.constructor()] : No Item Config provided');
            return;
        }

        this.config = config;
        this.x = this.config.x;
        this.y = this.config.y;
        this.width = this.config.width;
        this.height = this.config.height;
        this.type = this.config.type;
        this.subtype = this.config.subtype;

        try {
            this.Item = new ItemTypes(this.type, this.subtype, this.config).getItem();
        } catch (e) {
            console.error('[Editor.js - item.constructor()] : ' + e);
        }
    }

    render(layer) {
        if (!layer) {
            console.error('[Editor.js - item.addToLayer()] : No layer provided');
            return;
        }
        layer.add(this.Item);
        layer.draw();
    }

    remove(layer) {
        if (!layer) {
            console.error('[Editor.js - item.removeFromLayer()] : No layer provided');
            return;
        }
        layer.remove(this.Item);
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

class ItemTypes {
    item = null;
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
                        };
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
                console.log('Unsupported or non-visual ZPL command type.');
        }
    }

    getItem() {
        return this.item;
    }

    getConfig() {
        return this.config;
    }
}

function isCrosshairInLabel() {
    let crosshairPos = stage.getPointerPosition(); // Get current pointer position
    let labels = labelLayer.find('Rect'); // Find all labels in the labelLayer

    for (let i = 0; i < labels.length; i++) {
        let label = labels[i];
        let bbox = label.getClientRect(); // Get transformed bounding box

        // Check if the crosshair position is inside the label's bounding box
        if (crosshairPos.x >= bbox.x && crosshairPos.x <= bbox.x + bbox.width && crosshairPos.y >= bbox.y && crosshairPos.y <= bbox.y + bbox.height) {
            console.log(`Crosshair is inside label with ID: ${label.id()}`);
            return true;
        }
    }

    console.log('Crosshair is not inside any label');
    return false;
}

class DragableItem {
    object = null;
    config = null;
    constructor(config) {
        let itemConfig = new ItemTypes(config.type, config.subtype, config).getConfig();
        let newDraggableDOM = $('<div>')
            .css({
                width: itemConfig.width,
                height: itemConfig.height,
                backgroundColor: itemConfig.backgroundColor,
                zIndex: 1,
                border: '1px solid #000',
            })
            .addClass('draggable-item');
        console.log('Creating');
        this.object = newDraggableDOM;
        console.log(config);
        this.config = config;
        this.config.type = itemConfig.type;
        this.config.subtype = itemConfig.subtype;
        this.itemConfig = itemConfig;
        console.log(this.itemConfig);

        interact(this.object.get(0)).draggable({
            //this.* is no longer in the class object and is instead in the interact object
            listeners: {
                move(event) {
                    console.log('applying move');
                    console.log('moving');
                    window.isAddingObject = true;
                    const target = event.target;
                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    target.style.transform = `translate(${x}px, ${y}px)`;
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                },
                end(event) {
                    console.log('applying end');
                    console.log('stop');
                    window.isAddingObject = false;
                    let target = event.target;
                    const pointerPos = stage.getPointerPosition(); // Pointer position on the stage
                    const transform = stage.getAbsoluteTransform().copy().invert(); // Invert stage transformations
                    // Convert pointer position to stage-local coordinates
                    const stagePos = transform.point({
                        x: pointerPos.x,
                        y: pointerPos.y,
                    });
                    const { x, y } = stagePos;
                    console.log(isCrosshairInLabel());
                    try {
                        if (isCrosshairInLabel()) {
                            // Add the Konva item at the calculated position
                            let item = new Item({ x, y }).render(labelLayer);
                            item.render();
                            // Example: Add visual feedback to the item container
                            $('#itemContainer').prepend(this.object);
                        } else {
                            // return the item to its original position
                            $('#itemContainer').prepend(this.object);
                        }
                    } catch (e) {
                        console.error(e);
                        target.remove();
                    }
                    target.remove();
                },
            },
        });
    }

    drag() {
        console.log('drag()');
        if (window.isAddingObject) {
            $('#innerEditorCanvas').css('cursor', 'crosshair');

            // Create a temporary "shadow" object
            let draggedObject = this.object;
            const pointerPos = stage.getPointerPosition(); // Pointer position on the stage
            const transform = stage.getAbsoluteTransform().copy().invert(); // Invert stage transformations

            // Convert pointer position to stage-local coordinates
            const stagePos = transform.point({
                x: pointerPos.x,
                y: pointerPos.y,
            });

            const { x, y } = stagePos;

            // Create the shadow Konva object
            let shadow = new Konva.Rect({
                width: draggedObject.offsetWidth,
                height: draggedObject.offsetHeight,
                x: x,
                y: y,
                fill: 'rgba(0, 0, 0, 0.3)', // Semi-transparent shadow
                listening: false, // Disable events for the shadow object
            });

            objectLayer.add(shadow);
            objectLayer.draw(); // Redraw the layer to show the shadow

            // Listen for mousemove to make the object follow the cursor
            stage.on('mousemove', (evt) => {
                //if crosshair is within the label, show the preview.
                if (!isCrosshairInLabel()) return;
                const pointerPos = stage.getPointerPosition(); // Current pointer position
                const localPos = stage.getAbsoluteTransform().copy().invert().point({
                    x: pointerPos.x,
                    y: pointerPos.y,
                });

                shadow.position({
                    x: localPos.x,
                    y: localPos.y,
                });

                objectLayer.batchDraw(); // Efficiently redraw only updated parts
            });

            // On mouseleave or mouseup, finalize or remove the shadow
            $('#innerEditorCanvas').on('mouseleave mouseup', function () {
                stage.off('mousemove'); // Remove mousemove listener
                shadow.destroy(); // Remove the shadow object
                objectLayer.draw(); // Update the layer
            });
        }
    }
    getDraggableDOM() {
        return this.object;
    }
}
