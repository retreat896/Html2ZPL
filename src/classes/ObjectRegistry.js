class ObjectRegistry {
    constructor() {
        if (ObjectRegistry.instance) {
            return ObjectRegistry.instance;
        }
        this.registry = new Map();
        ObjectRegistry.instance = this;
    }

    register(definition) {
        if (!definition || !definition.type) {
            throw new Error('Invalid object definition: "type" is required.');
        }
        
        if (this.registry.has(definition.type)) {
            console.warn(`Object type "${definition.type}" is already registered. Overwriting.`);
        }

        this.registry.set(definition.type, definition);
    }

    get(type) {
        return this.registry.get(type);
    }

    getAll() {
        return Array.from(this.registry.values());
    }

    validate(type, props) {
        const def = this.get(type);
        if (!def) {
            throw new Error(`Unknown object type: ${type}`);
        }
        // Future: Implement schema validation using def.schema or similar
        return true;
    }
}

const instance = new ObjectRegistry();
Object.freeze(instance);

export default instance;
