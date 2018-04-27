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
  updatedAt: true,
  validate: []
};

class Factory {
  constructor(store, options) {
    this._store = store;
    this._options = { ...DEFAULT_FACTORY_OPTIONS, ...options };
    this.reset();
  }

  reset() {
    if (this._options.id) this._uniqueId = uniqueSequence();
    if (this._options.createdAt) this._lastCreatedAt = null;
  }

  newObject({ past, constraints = [] }) {
    const { factory } = this._options;
    const id = this._options.id ? this._uniqueId() : null;
    for (;;) {
      const object = factory();
      Object.assign(object, this._id(object, id));
      Object.assign(object, this._createdAt(object, past));
      Object.assign(object, this._updatedAt(object, past));
      if (this._isValid(object, constraints)) return object;
    }
  }

  _id(object, id) {
    if (!this._options.id || 'id' in object) return null;
    return { id };
  }

  _createdAt(object, past) {
    if (!this._options.createdAt || 'createdAt' in object) return null;
    if (!past) return { createdAt: new Date().toISOString() };
    const createdAt = this._lastCreatedAt == null
      ? faker.date.past()
      : faker.date.pastSince(this._lastCreatedAt);
    this._lastCreatedAt = createdAt.toISOString();
    return { createdAt: createdAt.toISOString() };
  }

  _updatedAt(object, past) {
    if (!this._options.updatedAt || 'updatedAt' in object) return null;
    if (!past || faker.random.boolean()) return { updatedAt: null };
    const updatedAt = this._options.createdAt
      ? faker.date.pastSince(object.createdAt)
      : faker.date.past();
    return { updatedAt: updatedAt.toISOString() };
  }

  _isValid(object, constraints) {
    const validators = [...this._options.validate, ...constraints];
    for (const validator of validators)
      if (!validator(object, this._store)) return false;
    return true;
  }
}

class Collection {
  // eslint-disable-next-line no-unused-vars
  createPast(count) { throw new Error('not implemented'); }
  // eslint-disable-next-line no-unused-vars
  createNew(options) { throw new Error('not implemented'); }
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
  constructor(factoryOptions, sort) {
    super();
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

  createPast(count) {
    if (this._createdNew)
      throw new Error('createPast() is not allowed after createNew()');
    for (let i = 0; i < count; i += 1) {
      const object = this._factory.newObject({ past: true });
      this._objects.push(object);
    }
    return this;
  }

  createNew(options = {}) {
    const object = this._factory.newObject({ ...options, past: false });
    this._objects.push(object);
    this._createdNew = true;
    return object;
  }

  get size() { return this._objects.length; }
  get(index) { return this._objects[index]; }

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

  createPast(count) {
    this._store.createPast(count);
    return this;
  }

  createNew(options) { return this._transform(this._store.createNew(options)); }
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

const splitOptions = (options) => {
  const factoryOptions = { ...options };
  delete factoryOptions.name;
  delete factoryOptions.sort;
  delete factoryOptions.views;
  return {
    name: options.name,
    factoryOptions,
    sort: options.sort,
    views: options.views != null ? options.views : []
  };
};

export const dataStore = (options) => {
  // eslint-disable-next-line object-curly-newline
  const { name, factoryOptions, sort, views } = splitOptions(options);
  const store = new Store(factoryOptions, sort);
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
