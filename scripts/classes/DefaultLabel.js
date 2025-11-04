export default class DefaultLabel {
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