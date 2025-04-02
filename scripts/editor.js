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
            class: 'label',
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
        console.log(config);

        this.config = config;
        this.x = this.config.x;
        this.y = this.config.y;
        this.width = this.config.width;
        this.height = this.config.height;
        this.label = this.config.label;
        this.type = this.config.type;
        this.subtype = this.config.subtype;

        try {
            this.Item = new ItemTypes(this.type, this.subtype, this.config).getItem();
            this.allowResize();
            this.allowDragging();
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
    allowResize() {
        const layer = extraLayer1;
        const tr = new Konva.Transformer({
            keepRatio: false,
            boundBoxFunc: (oldBox, newBox) => {
                // Prevent the transformer from inverting width/height
                if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                }
                return newBox;
            },
        });
        layer.add(tr);
        let selectionRectangle = new Konva.Rect({
            fill: 'rgba(0,0,255,0.5)',
            visible: false,
        });
        layer.add(selectionRectangle);
        let x1, y1, x2, y2;
        stage.on('mousedown touchstart', (e) => {
            // do nothing if we mousedown on any shape
            if (e.target !== stage) {
                return;
            }
            x1 = stage.getPointerPosition().x;
            y1 = stage.getPointerPosition().y;
            x2 = stage.getPointerPosition().x;
            y2 = stage.getPointerPosition().y;

            selectionRectangle.visible(true);
            selectionRectangle.width(0);
            selectionRectangle.height(0);
        });
        stage.on('mousemove touchmove', () => {
            // do nothing if we didn't start selection
            if (!selectionRectangle.visible()) {
                return;
            }
            x2 = stage.getPointerPosition().x;
            y2 = stage.getPointerPosition().y;

            selectionRectangle.setAttrs({
                x: Math.min(x1, x2),
                y: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1),
            });
        });

        stage.on('mouseup touchend', () => {
            // do nothing if we didn't start selection
            if (!selectionRectangle.visible()) {
                return;
            }
            // update visibility in timeout, so we can check it in click event
            setTimeout(() => {
                selectionRectangle.visible(false);
            });
            try {
                tr.nodes(selected);
            } catch (e) {
                //deselect
                tr.nodes([]);
            }
        });
        stage.on('click tap', function (e) {
            // if we are selecting with rect, do nothing
            if (selectionRectangle.visible()) {
                return;
            }

            // if click on empty area - remove all selections
            if (e.target === stage) {
                tr.nodes([]);
                return;
            }

            if (e.target.attrs.class === 'label') {
                tr.nodes([]);
                return;
            }

            // do we pressed shift or ctrl?
            const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
            const isSelected = tr.nodes().indexOf(e.target) >= 0;

            if (!metaPressed && !isSelected) {
                // if no key pressed and the node is not selected
                // select just one
                tr.nodes([e.target]);
            } else if (metaPressed && isSelected) {
                // if we pressed keys and node was selected
                // we need to remove it from selection:
                const nodes = tr.nodes().slice(); // use slice to have new copy of array
                // remove node from array
                nodes.splice(nodes.indexOf(e.target), 1);
                tr.nodes(nodes);
            } else if (metaPressed && !isSelected) {
                // add the node into selection
                const nodes = tr.nodes().concat([e.target]);
                tr.nodes(nodes);
            }
            tr.nodes().forEach((node) => {
                node.strokeScaleEnabled(false);
            });
        });
    }
    allowDragging() {
        if (!this.label) {
            console.error('[Item] : Label ID not found for this item.');
            return;
        }

        let label = labelLayer.findOne(`#${this.label}`); // Find the associated label
        if (!label) {
            console.error(`[Item] : No label found with ID ${this.label}`);
            return;
        }

        this.Item.on('dragmove', (e) => {
            let item = e.target;

            // Get label position and size
            let labelPos = label.getClientRect({ relativeTo: stage });
            let labelWidth = label.width();
            let labelHeight = label.height();

            // Get item size
            let itemWidth = item.width() * item.scaleX();
            let itemHeight = item.height() * item.scaleY();

            // Get new position
            let newX = item.x();
            let newY = item.y();

            // Prevent moving outside left/right
            if (newX < labelPos.x) {
                newX = labelPos.x;
            } else if (newX + itemWidth > labelPos.x + labelWidth) {
                newX = labelPos.x + labelWidth - itemWidth;
            }

            // Prevent moving outside top/bottom
            if (newY < labelPos.y) {
                newY = labelPos.y;
            } else if (newY + itemHeight > labelPos.y + labelHeight) {
                newY = labelPos.y + labelHeight - itemHeight;
            }

            // Apply corrected position
            item.setPosition({ x: newX, y: newY });
        });
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
                            draggable: true,
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
                console.log('Unsupported or non-visual ZPL command type. ' + type, subtype);
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
            return true;
        }
    }
    return false;
}

function getLabelUnderPointer(pointerPos) {
    let labels = labelLayer.find('Rect'); // Get all labels
    return (
        labels.find((label) => {
            let box = label.getClientRect();
            return pointerPos.x >= box.x && pointerPos.x <= box.x + box.width && pointerPos.y >= box.y && pointerPos.y <= box.y + box.height;
        }) || null
    );
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
        this.object = newDraggableDOM;
        this.itemConfig = itemConfig;
        this.config = config;
        let reference = this;

        interact(this.object.get(0)).draggable({
            //this.* is no longer in the class object and is instead in the interact object
            listeners: {
                start(event) {
                    let shadow = new Konva.Rect({
                        id: 'shadow',
                        width: newDraggableDOM.get(0).offsetWidth,
                        height: newDraggableDOM.get(0).offsetHeight,
                        x: 0,
                        y: 0,
                        fill: 'rgba(255, 0, 0, 0.3)', // Semi-transparent shadow
                        listening: false, // Disable events for the shadow object
                        visible: false,
                    });
                    extraLayer1.add(shadow);
                    extraLayer1.draw();
                },
                move(event) {
                    window.isAddingObject = true;
                    const target = event.target;
                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    target.style.transform = `translate(${x}px, ${y}px)`;
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);

                    // shadow
                    $('#innerEditorCanvas').css('cursor', 'crosshair');
                    let shadow = extraLayer1.findOne('#shadow');
                    const pointerPos = stage.getPointerPosition(); // Pointer position on the stage
                    const transform = stage.getAbsoluteTransform().copy().invert(); // Invert stage transformations
                    // Convert pointer position to stage-local coordinates
                    let stagePos;

                    stagePos = transform.point({
                        x: pointerPos.x,
                        y: pointerPos.y,
                    });

                    if (shadow && x && y) {
                        shadow.visible(true);
                        extraLayer1.draw();
                        shadow.x(stagePos.x);
                        shadow.y(stagePos.y);
                        shadow.to({
                            duration: 0.1,
                            fill: isCrosshairInLabel() ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)',
                        });
                    } else {
                        shadow.visible(false);
                    }
                },
                end(event) {
                    console.log('drag end');
                    window.isAddingObject = false;
                    let target = event.target;
                    const pointerPos = stage.getPointerPosition(); // Pointer position on the stage
                    const transform = stage.getAbsoluteTransform().copy().invert(); // Invert stage transformations
                    // Convert pointer position to stage-local coordinates
                    const stagePos = transform.point({
                        x: pointerPos.x,
                        y: pointerPos.y,
                    });
                    config.x = stagePos.x;
                    config.y = stagePos.y;
                    try {
                        if (isCrosshairInLabel()) {
                            // Add the Konva item at the calculated position
                            let label = getLabelUnderPointer(pointerPos);
                            console.log(label);
                            config.label = label.attrs.id;
                            let item = new Item({ ...config }).render(labelLayer);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                    let shadow = extraLayer1.findOne('#shadow');
                    shadow.remove();
                    extraLayer1.draw();

                    let clonedItem = new DragableItem(config);
                    $('#itemContainer').append(clonedItem.getDraggableDOM());
                    target.remove();
                },
            },
        });
    }
    getDraggableDOM() {
        return this.object;
    }
}
