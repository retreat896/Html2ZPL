import LabelObject from '../LabelObject';

export default class TextObject extends LabelObject {
    constructor(props = {}) {
        super('text', props);
        this.text = props.text || 'New Text';
        this.font = props.font || '0'; // ZPL font 0
        this.fontSize = props.fontSize || 30;
        this.orientation = props.orientation || 'N'; // N, R, I, B
    }

    toZPL() {
        // ^FOx,y^Afont,orientation,height,width^FDdata^FS
        return `^FX Text Object ID: ${this.id}
^FO${this.x},${this.y}^A${this.font}${this.orientation},${this.fontSize},${this.fontSize}^FD${this.text}^FS`;
    }

    getProps() {
        return {
            text: this.text,
            font: this.font,
            fontSize: this.fontSize,
            orientation: this.orientation
        };
    }
}
