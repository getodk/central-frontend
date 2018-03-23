/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

import faker from './faker';
import { uniqueSequence } from '../lib/util';

const DEFAULT_FACTORY_OPTIONS = {
  id: true,
  createdAt: true,
  updatedAt: true
};

class Factory {
  constructor(store, options) {
    this._store = store;
    this._options = Object.assign({}, DEFAULT_FACTORY_OPTIONS, options);
    this.reset();
  }

  reset() {
    if (this._options.id) this._uniqueId = uniqueSequence();
    if (this._options.createdAt) this._lastCreatedAt = null;
  }

  newObject({ seed = false, constraints = null }) {
    const { factory } = this._options;
    const id = this._options.id ? this._uniqueId() : null;
    for (;;) {
      const object = factory();
      Object.assign(object, this._id(object, id));
      Object.assign(object, this._createdAt(object, seed));
      Object.assign(object, this._updatedAt(object, seed));
      if (this._isValid(object, constraints)) return object;
    }
  }

  _id(object, id) {
    if (!this._options.id || 'id' in object) return null;
    return { id };
  }

  _createdAt(object, seed) {
    if (!this._options.createdAt || 'createdAt' in object) return null;
    if (!seed) return { createdAt: new Date().toISOString() };
    const createdAt = this._lastCreatedAt == null
      ? faker.date.past()
      : faker.date.pastSince(this._lastCreatedAt);
    this._lastCreatedAt = createdAt.toISOString();
    return { createdAt: createdAt.toISOString() };
  }

  _updatedAt(object, seed) {
    if (!this._options.updatedAt || 'updatedAt' in object) return null;
    if (!seed || faker.random.boolean()) return { updatedAt: null };
    const updatedAt = !this._options.createdAt
      ? faker.date.pastSince(object.createdAt)
      : faker.date.past();
    return { updatedAt: updatedAt.toISOString() };
  }

  _isValid(object, constraints) {
    if (this._options.validate == null) return true;
    const validators = constraints == null
      ? this._options.validate
      : [...this._options.validate, ...constraints];
    for (const validator of validators)
      if (!validator(object, this._store)) return false;
    return true;
  }
}

class Collection {
  // eslint-disable-next-line no-unused-vars
  seed(count) { throw new Error('not implemented'); }
  // eslint-disable-next-line no-unused-vars
  create(options) { throw new Error('not implemented'); }
  get size() { throw new Error('not implemented'); }
  // eslint-disable-next-line no-unused-vars
  get(index) { throw new Error('not implemented'); }
  clear() { throw new Error('not implemented'); }
  // eslint-disable-next-line no-unused-vars
  splice(start, deleteCount) { throw new Error('not implemented'); }
  toArray() { throw new Error('not implemented'); }
  _sortInstructions() { throw new Error('not implemented'); }

  first() { return this.size !== 0 ? this.get(0) : null; }
  last() { return this.size !== 0 ? this.get(this.size - 1) : null; }

  random() {
    if (this.size === 0) return null;
    return this.get(faker.random.number({ max: this.size - 1 }));
  }

  firstOrSeed() {
    if (this.size === 0) this.seed(1);
    return this.first();
  }

  randomOrSeed() {
    if (this.size !== 0) return this.random();
    this.seed(1);
    return this.first();
  }

  sorted() {
    if (this._sortInstructions() == null) return this.toArray();
    return this.toArray().sort((object1, object2) => {
      for (const instruction of this._sortInstructions()) {
        const compare = this._compareObjects(object1, object2, instruction);
        if (compare !== 0) return compare;
      }
      return 0;
    });
  }

  _compareObjects(object1, object2, instruction) {
    if (typeof instruction === 'string')
      return this._compareValues(object1[instruction], object2[instruction]);
    else if (typeof instruction === 'function')
      return this._compareValues(instruction(object1), instruction(object2));
    throw new Error('invalid sort instruction');
  }

  _compareValues(value1, value2) {
    if (value1 < value2)
      return -1;
    else if (value1 > value2)
      return 1;
    return 0;
  }
}

class Store extends Collection {
  constructor(factoryOptions, sortInstructions) {
    super();
    this._factory = new Factory(this, factoryOptions);
    this._sort = sortInstructions;
    this._seedable = true;
    this.clear();
  }

  seed(count) {
    if (!this._seedable) throw new Error('store has already been seeded');
    for (let i = 0; i < count; i += 1) {
      const object = this._factory.newObject({ seed: true });
      this._objects.push(object);
    }
    return this;
  }

  create(options = {}) {
    const object = this._factory.newObject(options);
    if (options.seed !== true) this._seedable = false;
    this._objects.push(object);
    return object;
  }

  get size() { return this._objects.length; }
  get(index) { return this._objects[index]; }

  clear() {
    this._objects = [];
    this._seedable = true;
  }

  splice(start, deleteCount) { return this._objects.splice(start, deleteCount); }
  toArray() { return [...this._objects]; }
  _sortInstructions() { return this._sort; }

  factory() { return this._factory; }
}

class View extends Collection {
  constructor(store, transform) {
    super();
    this._store = store;
    this._transform = transform;
    this._cache = new Map();
  }

  seed(count) {
    this._store.seed(count);
    return this;
  }

  create(options) { return this._transform(this._store.create(options)); }
  get size() { return this._store.size; }
  get(index) { return this._transform(this._store.get(index)); }
  clear() { this._store.clear(); }
  splice(start, deleteCount) { return this._store.splice(start, deleteCount); }
  toArray() { return this._store.toArray().map(object => this._transform(object)); }
  _sortInstructions() { return this._store._sortInstructions(); }

  _transform(object) {
    if (this._cache.has(object)) return this._cache.get(object);
    const transform = this._tranform();
    const result = transform(object);
    this._cache.set(object, result);
    return result;
  }
}

const stores = [];

const splitOptions = (options) => {
  const factoryOptions = Object.assign({}, options);
  delete factoryOptions.name;
  delete factoryOptions.sort;
  delete factoryOptions.views;
  return {
    name: options.name,
    factoryOptions,
    sortInstructions: options.sort,
    views: options.views != null ? options.views : []
  };
};

export const dataStore = (options) => {
  // eslint-disable-next-line object-curly-newline
  const { name, factoryOptions, sortInstructions, views } = splitOptions(options);
  const store = new Store(factoryOptions, sortInstructions);
  stores.push(store);
  const collections = { [name]: store };
  for (const [viewName, transform] of Object.entries(views))
    collections[viewName] = new View(store, transform);
  return collections;
};

export const resetDataStores = () => {
  for (const store of stores) {
    store.clear();
    store.factory().reset();
  }
};
