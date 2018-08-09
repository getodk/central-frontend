import faker from '../faker';
import { uniqueSequence } from '../../lib/util';

class Factory {
  constructor(store, options) {
    this._store = store;
    this._options = { ...options };
    if (this._options.validate === undefined) this._options.validate = [];
    this.reset();
  }

  reset() {
    this._uniqueId = uniqueSequence();
    this._lastCreatedAt = null;
  }

  options() { return this._options; }

  /*
  newObject() returns a new valid object for the store. It can be called in any
  of the following ways:

    newObject(inPast)
    newObject(inPast, constraintOrConstraints)
    newObject(inPast, factoryFunctionOptions)

  with the following parameters:

    - inPast. If true, the value of the new object's createdAt property will be
      in the past. If false, the value will be set to the current time. `inPast`
      has no effect if the Factory's options specify that new objects be created
      without a createdAt property.
    - constraintOrConstraints. Either a String or an Array of Strings, where
      each String is the name of one of the constraints specified in the
      Factory's options. The constraints with the specified names will be
      applied to the new object.
    - factoryFunctionOptions. Options to pass to the factory function. Not all
      factory functions require options.

  Constraints and factory function options fill similar roles: they both specify
  information about the new object. However, they do so in different ways.
  Unlike constraints, factory function options are passed to the factory
  function, which uses the options while creating each new object candidate.
  After a candidate is returned, it is validated against the constraints and is
  rejected if it does not satisfy them.

  Constraints are useful for specifying a particular condition, for example,
  "the form state is open" or "the app user's access was revoked." Factory
  function options are useful for specifying a particular property, for example,
  "the form name is 'Household Survey'." Factory function options can be used to
  pass any information to the factory function, so constraints can usually be
  implemented using factory function options. Because a constraint failure
  results in the creation of a new object candidate, factory function options
  are usually more performant than constraints. We may remove constraints at
  some point and replace them with factory function options.
  */
  newObject(inPast, constraintsOrOptions = undefined) {
    const { constraints, factoryFunctionOptions } =
      this._constraintsAndOptions(constraintsOrOptions);
    const { factory } = this._options;
    const id = this._uniqueId();
    for (;;) {
      const object = factory({
        ...factoryFunctionOptions,
        inPast,
        lastCreatedAt: this._lastCreatedAt,
        id
      });
      if (this._isValid(object, constraints)) {
        this._lastCreatedAt = object.createdAt;
        return object;
      }
    }
  }

  _constraintsAndOptions(constraintsOrOptions) {
    if (constraintsOrOptions == null)
      return { constraints: [], factoryFunctionOptions: {} };
    if (typeof constraintsOrOptions === 'object' && !Array.isArray(constraintsOrOptions))
      return { constraints: [], factoryFunctionOptions: constraintsOrOptions };
    const constraintNames = Array.isArray(constraintsOrOptions)
      ? constraintsOrOptions
      : [constraintsOrOptions];
    if (constraintNames.length > 0 && this._options.constraints == null)
      throw new Error('no constraints are defined for the factory');
    const constraints = constraintNames.map(name => {
      const constraint = this._options.constraints[name];
      if (constraint == null) throw new Error('unknown constraint');
      return constraint;
    });
    return { constraints, factoryFunctionOptions: {} };
  }

  _isValid(object, constraints) {
    const validators = constraints.length !== 0
      ? [...this._options.validate, ...constraints]
      : this._options.validate;
    for (const validator of validators)
      if (!validator(object, this._store)) return false;
    return true;
  }
}

class Collection {
  // eslint-disable-next-line no-unused-vars
  createPast(count, constraintsOrOptions = undefined) { throw new Error('not implemented'); }
  // eslint-disable-next-line no-unused-vars
  createNew(constraintsOrOptions = undefined) { throw new Error('not implemented'); }
  get size() { throw new Error('not implemented'); }
  // eslint-disable-next-line no-unused-vars
  get(index) { throw new Error('not implemented'); }
  clear() { throw new Error('not implemented'); }
  // eslint-disable-next-line no-unused-vars
  splice(start, deleteCount) { throw new Error('not implemented'); }
  sorted() { throw new Error('not implemented'); }

  first() { return this.size !== 0 ? this.get(0) : undefined; }
  last() { return this.size !== 0 ? this.get(this.size - 1) : undefined; }

  random() {
    if (this.size === 0) return undefined;
    return this.get(faker.random.number({ max: this.size - 1 }));
  }

  firstOrCreatePast() {
    if (this.size === 0) this.createPast(1);
    return this.first();
  }

  randomOrCreatePast() {
    if (this.size !== 0) return this.random();
    this.createPast(1);
    return this.first();
  }
}

class Store extends Collection {
  constructor(options) {
    super();
    const { sort, ...factoryOptions } = options;
    this._factory = new Factory(this, factoryOptions);
    this._setCompareFunction(sort);
    this.clear();
  }

  _setCompareFunction(sort) {
    if (sort == null) return;
    if (typeof sort === 'function') {
      this._compareFunction = sort;
      return;
    }
    if (typeof sort === 'string') {
      this._setCompareFunction([sort, true]);
      return;
    }
    const [propertyName, asc] = sort;
    this._compareFunction = (object1, object2) => {
      const value1 = object1[propertyName];
      const value2 = object2[propertyName];
      if (value1 < value2)
        return asc ? -1 : 1;
      else if (value2 > value1)
        return asc ? 1 : -1;
      return 0;
    };
  }

  createPast(count, constraintsOrOptions = undefined) {
    if (this._createdNew)
      throw new Error('createPast() is not allowed after createNew()');
    for (let i = 0; i < count; i += 1) {
      const object = this._factory.newObject(true, constraintsOrOptions);
      this._objects.push(object);
    }
    return this;
  }

  createNew(constraintsOrOptions = undefined) {
    const object = this._factory.newObject(false, constraintsOrOptions);
    this._objects.push(object);
    this._createdNew = true;
    return object;
  }

  get size() { return this._objects.length; }
  get(index) { return this._objects[index]; }

  update(object, callback) {
    const { createdAt } = object;
    callback(object);
    // eslint-disable-next-line no-param-reassign
    if ('updatedAt' in object) object.updatedAt = new Date().toISOString();
    if (object.createdAt !== createdAt) {
      // this._objects is sorted by createdAt, so we currently do not support
      // updates to createdAt.
      throw new Error('createdAt cannot be updated');
    }
    for (const validator of this._factory.options().validate)
      if (!validator(object, this))
        throw new Error('object is no longer valid');
  }

  clear() {
    this._objects = [];
    this._createdNew = false;
  }

  splice(start, deleteCount) { return this._objects.splice(start, deleteCount); }

  sorted() {
    if (this._compareFunction == null) return [...this._objects];
    const compare = this._compareFunction;
    return [...this._objects].sort(compare);
  }

  factory() { return this._factory; }
}

class View extends Collection {
  constructor(store, transform) {
    super();
    this._store = store;
    this._callback = transform;
    this._cache = new Map();
  }

  createPast(count, constraintsOrOptions = undefined) {
    this._store.createPast(count, constraintsOrOptions);
    return this;
  }

  createNew(constraintsOrOptions = undefined) {
    return this._transform(this._store.createNew(constraintsOrOptions));
  }

  get size() { return this._store.size; }
  get(index) { return this._transform(this._store.get(index)); }
  clear() { this._store.clear(); }
  splice(start, deleteCount) { return this._store.splice(start, deleteCount); }

  sorted() {
    const sorted = this._store.sorted();
    for (let i = 0; i < sorted.length; i += 1)
      sorted[i] = this._transform(sorted[i]);
    return sorted;
  }

  _transform(object) {
    if (object == null) return object;
    if (this._cache.has(object)) return this._cache.get(object);
    const transform = this._callback;
    const result = transform(object);
    this._cache.set(object, result);
    return result;
  }
}

const stores = [];

export const dataStore = (options) => {
  const store = new Store(options);
  stores.push(store);
  return store;
};

export const view = (store, transform) => new View(store, transform);

export const resetDataStores = () => {
  for (const store of stores) {
    store.clear();
    store.factory().reset();
  }
};
