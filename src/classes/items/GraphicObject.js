import LabelObject from '../LabelObject';

export default class GraphicObject extends LabelObject {
    constructor(props = {}) {
        super('graphic', props);
        this.shape = props.shape || 'box'; // box, circle, line
        this.width = props.width || 100;
        this.height = props.height || 100;
        this.thickness = props.thickness || 1;
        this.color = props.color || 'B'; // B=Black, W=White
    }

    toZPL() {
        let command = '';

        switch (this.shape) {
            case 'box':
                // ^GBw,h,t,c,r
                command = `^GB${this.width},${this.height},${this.thickness},${this.color},0`;
                break;
            case 'circle':
                // ^GCd,t,c
                command = `^GC${this.width},${this.thickness},${this.color}`;
                break;
            case 'line':
                // ^GDw,h,t,c,o
                // Diagonal line, but often used for simple lines too if h or w is 0
                command = `^GD${this.width},${this.height},${this.thickness},${this.color},L`;
                break;
            default:
                command = `^GB${this.width},${this.height},${this.thickness},${this.color},0`;
        }

        return `^FX Graphic Object ID: ${this.id}
^FO${this.x},${this.y}${command}^FS`;
    }

    getProps() {
        return {
            shape: this.shape,
            width: this.width,
            height: this.height,
            thickness: this.thickness,
            color: this.color
        };
    }
}
