/**
 * Singleton registry for managing object definitions and types.
 */
class ObjectRegistry {
    /**
     * Initializes the ObjectRegistry singleton.
     * If an instance already exists, returns it.
     */
    constructor() {
        if (ObjectRegistry.instance) {
            return ObjectRegistry.instance;
        }
        this.registry = new Map();
        ObjectRegistry.instance = this;
    }

    /**
     * Registers a new object definition.
     * @param {Object} definition - The object definition to register.
     * @param {string} definition.type - The unique type identifier for the object.
     * @throws {Error} If the definition is invalid or missing the 'type' property.
     */
    register(definition) {
        if (!definition || !definition.type) {
            throw new Error('Invalid object definition: "type" is required.');
        }
        
        if (this.registry.has(definition.type)) {
            console.warn(`Object type "${definition.type}" is already registered. Overwriting.`);
        }

        this.registry.set(definition.type, definition);
    }

    /**
     * Retrieves an object definition by type.
     * @param {string} type - The type of the object to retrieve.
     * @returns {Object|undefined} The object definition, or undefined if not found.
     */
    get(type) {
        return this.registry.get(type);
    }

    /**
     * Retrieves all registered object definitions.
     * @returns {Array<Object>} An array of all registered object definitions.
     */
    getAll() {
        return Array.from(this.registry.values());
    }

    /**
     * Validates properties against a registered object type.
     * @param {string} type - The type of the object to validate.
     * @param {Object} props - The properties to validate.
     * @returns {boolean} True if valid.
     * @throws {Error} If the object type is unknown.
     */
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
