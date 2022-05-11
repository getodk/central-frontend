import { isBefore } from '../util/date-time';

// An array-like collection of objects. Objects may be created, read, sorted,
// and deleted. The objects are ordered within the collection in order of
// creation.
class Collection {
  /* eslint-disable no-unused-vars */

  // Generates an object and adds it to the collection. If the object has a
  // createdAt property, it will be in the past. Returns the collection for
  // chaining.
  createPast(count, options = undefined) { throw new Error('not implemented'); }
  // Generates an object and adds it to the collection. If the object has a
  // createdAt property, it will be set to the current time. Returns the new
  // object.
  createNew(options = undefined) { throw new Error('not implemented'); }
  // Returns the number of objects in the store.
  get size() { throw new Error('not implemented'); }
  // Returns the object at the specified index. The index may be negative.
  get(index) { throw new Error('not implemented'); }
  // Returns the objects of the collection as an Array that is sorted in some
  // way (in order of creation or otherwise).
  sorted() { throw new Error('not implemented'); }
  splice(start, deleteCount) { throw new Error('not implemented'); }

  /* eslint-enable no-unused-vars */

  first() { return this.get(0); }
  last() { return this.get(-1); }
}

// Implements the methods of Collection.
class Store extends Collection {
  constructor({
    // A factory function that generates objects for the store. createPast() and
    // createNew() pass arguments to the factory; see _create() for details.
    factory,
    // A compare function that sorted() will use to sort the objects in the
    // store
    sort = undefined
  }) {
    super();
    // When we run the callback later, we do not want it to be bound to the
    // Store.
    this._factory = factory.bind(null);
    this._compareFunction = sort;
    this.reset();
  }

  reset() {
    this._objects = [];
    this._id = 0;
    this._lastCreatedAt = null;
  }

  createPast(count, options = undefined) {
    for (let i = 0; i < count; i += 1)
      this._create(true, options);
    return this;
  }

  createNew(options = undefined) {
    return this._create(false, options);
  }

  _create(inPast, options = undefined) {
    this._id += 1;
    const object = this._factory({
      ...options,

      // We always pass the following arguments to the factory, but they might
      // not be relevant to all factories.

      // inPast is relevant to factories that return objects with a createdAt
      // property. If inPast is `true`, the createdAt property of the resulting
      // object should be in the past. If it is `false`, its createdAt property
      // should be set to the current time.
      inPast,
      // id is relevant to factories that return objects with an `id` property.
      id: this._id,
      // lastCreatedAt is relevant to factories that return objects with a
      // createdAt property. The createdAt property of the resulting object
      // should be greater than or equal to lastCreatedAt.
      lastCreatedAt: this._lastCreatedAt
    });

    if (object.createdAt != null && this._lastCreatedAt != null &&
      isBefore(object.createdAt, this._lastCreatedAt))
      throw new Error('invalid createdAt');
    this._lastCreatedAt = object.createdAt;

    this._objects.push(object);
    return object;
  }

  get size() { return this._objects.length; }

  get(index) {
    if (index >= 0) return this._objects[index];
    return index >= -this._objects.length
      ? this._objects[this._objects.length + index]
      : undefined;
  }

  sorted() {
    const copy = [...this._objects];
    if (this._compareFunction != null) copy.sort(this._compareFunction);
    return copy;
  }

  splice(start, deleteCount) {
    return this._objects.splice(start, deleteCount);
  }

  // Updates an object in the store, setting the properties specified by
  // `props`. If the object has an updatedAt property, it will be set to the
  // current time. Returns the updated object.
  update(index, props = undefined) {
    const normalizedIndex = index >= 0 ? index : this._objects.length + index;
    if (normalizedIndex >= this._objects.length || normalizedIndex < 0)
      throw new Error('invalid index');
    if (props != null && 'createdAt' in props) {
      // Objects are ordered in the store in order of creation. If the factory
      // returns objects with a createdAt property, then the objects should also
      // be ordered by createdAt. (The order by createdAt should match the
      // actual order of creation.) Because of that, update() does not support
      // updating an object's createdAt property.
      throw new Error('createdAt cannot be updated');
    }
    const object = this._objects[normalizedIndex];
    const updated = { ...object, ...props };
    if ('updatedAt' in object) updated.updatedAt = new Date().toISOString();
    this._objects[normalizedIndex] = updated;
    return updated;
  }
}

// A view/transformation of a Store
class View extends Collection {
  constructor(store, transform) {
    super();
    this._store = store;
    // When we run the callback later, we do not want it to be bound to the
    // View.
    this._transform = transform.bind(null);
  }

  createPast(count, options = undefined) {
    this._store.createPast(count, options);
    return this;
  }

  createNew(options = undefined) {
    return this._transform(this._store.createNew(options));
  }

  get size() { return this._store.size; }

  get(index) {
    const object = this._store.get(index);
    return object !== undefined ? this._transform(object) : undefined;
  }

  sorted() {
    const sorted = this._store.sorted();
    for (let i = 0; i < sorted.length; i += 1)
      sorted[i] = this._transform(sorted[i]);
    return sorted;
  }

  splice(start, deleteCount) {
    return this._store.splice(start, deleteCount)
      .map(object => this._transform(object));
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
  for (const store of stores)
    store.reset();
};
