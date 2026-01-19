import { v4 as uuidv4 } from 'uuid';

/**
 * Base class for all label objects.
 * Represents an element that can be placed on a label.
 */
export default class LabelObject {
    /**
     * Creates a new LabelObject instance.
     * @param {string} type - The type of the object (e.g., 'text', 'barcode').
     * @param {Object} [props={}] - Initial properties for the object.
     * @param {string} [props.id] - Unique identifier. Defaults to a new UUID.
     * @param {number} [props.x=0] - X-coordinate position.
     * @param {number} [props.y=0] - Y-coordinate position.
     * @param {string} [props.zplCommand=''] - Raw ZPL command if applicable.
     */
    constructor(type, props = {}) {
        this.id = props.id || uuidv4();
        this.type = type;
        this.x = props.x || 0;
        this.y = props.y || 0;
        this.zplCommand = props.zplCommand || '';
    }

    /**
     * Converts the object to its ZPL representation.
     * Must be implemented by subclasses.
     * @abstract
     * @returns {string} The ZPL command string.
     * @throws {Error} If not implemented.
     */
    toZPL() {
        throw new Error('Method "toZPL" must be implemented.');
    }


    /**
     * Serializes the object to JSON.
     * @returns {Object} JSON representation of the object.
     */
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

    /**
     * Gets specific properties for JSON serialization.
     * Can be overridden by subclasses to include specific data.
     * @returns {Object} Key-value pairs of properties.
     */
    getProps() {
        return {};
    }


    /**
     * Renders the object.
     * Currently returns the JSON representation for React retrieval, but could be adapted for Canvas.
     * @returns {Object} The render data.
     */
    render() {
        // For now, we might just return data for React to render
        return this.toJSON();
    }

    /**
     * Handles resizing of the object.
     * Returns a partial object with updated properties.
     * @abstract
     * @param {string} handle - The handle used for resizing (e.g., 'se', 'n').
     * @param {Object} delta - The change in position/size ({x, y}).
     * @param {Object} settings - Grid settings or other constraints.
     * @param {Object} initialProps - The properties of the object before resizing started.
     * @returns {Object} Updated properties (e.g., { width, height, x, y }).
     * @throws {Error} If not implemented.
     */
    resize(handle, delta, settings, initialProps) {
        throw new Error('Method "resize" must be implemented.');
    }
}
