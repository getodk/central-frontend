const newProperty = Symbol('new property');
const inFormProperty = Symbol('inform property');
const defaultProperty = Symbol('default property');

export class PropertyEnum {
    static get NewProperty() { return newProperty; }
    static get InFormProperty() { return inFormProperty; }
    static get DefaultProperty() { return defaultProperty; } 
}