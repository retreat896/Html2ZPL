import { v4 as uuidv4 } from 'uuid';

export default class LabelObject {
    constructor(type, props = {}) {
        this.id = props.id || uuidv4();
        this.type = type;
        this.x = props.x || 0;
        this.y = props.y || 0;
        this.zplCommand = props.zplCommand || '';
    }

    // Abstract method to be implemented by subclasses
    toZPL() {
        throw new Error('Method "toZPL" must be implemented.');
    }

    // Common JSON serialization
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            props: this.getProps()
        };
    }

    // Abstract method to get specific properties for JSON
    getProps() {
        return {};
    }

    // Abstract method to render on canvas (if using canvas) or return React component props
    render() {
        // For now, we might just return data for React to render
        return this.toJSON();
    }
    // Abstract method to handle resizing
    // Returns partial object with updated properties
    resize(handle, delta, settings, initialProps) {
        throw new Error('Method "resize" must be implemented.');
    }
}
