import ItemTypes from "./ZPLItemTypes";
import DefaultLabel from "./DefaultLabel";
import {enableDragging} from "./DefaultDraggable";
import {enableResize} from "./DefaultResize";

export default class Item {
    constructor(config) {
        if (!config) {
            console.error('[Editor.js - item.constructor()] : No Item Config provided');
            return;
        }

        this.config = config;
        this.type = this.config.type;
        this.subtype = this.config.subtype;

        try {
            this.Item = new ItemTypes(this.type, this.subtype, this.config).getItem();
            enableResize(Item);
            enableDragging(Item);
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

    //-========== Getters ==========-

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


    //-========== Setters ==========-

}