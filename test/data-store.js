/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
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

  options() { return this._options; }

  /*
  newObject() returns a new valid object for the store. It can be called in any
  of the following ways:

    newObject(past)
    newObject(past, constraintOrConstraints)
    newObject(past, factoryFunctionOptions)

  with the following parameters:

    - past. If true, the value of the new object's createdAt property will be in
      the past. If false, the value will be set to the current time. `past` has
      no effect if the Factory's options specify that new objects be created
      without a createdAt property.
    - constraintsOrConstraints. Either a String or an Array of Strings, where
      each String is the name of a constraint specified with the Factory's
      options. The specified constraints will be applied to the new object.
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
  "the form title is 'Household Survey'." Factory function options can used to
  pass any information to the factory function, so constraints can usually be
  implemented using factory function options. Because a constraint failure
  results in the creation of a new object candidate, factory function options
  are usually more performant than constraints. We may remove constraints at
  some point and replace them with factory function options.
  */
  newObject(past, constraintsOrOptions = undefined) {
    const { constraints, factoryFunctionOptions } =
      this._constraintsAndOptions(constraintsOrOptions);
    const { factory } = this._options;
    const id = this._options.id ? this._uniqueId() : null;
    for (;;) {
      // An object that contains the base properties of the new object: id,
      // createdAt, and updatedAt.
      const base = {};
      if (this._options.id) base.id = id;
      if (this._options.createdAt) base.createdAt = this._createdAt(past);
      if (this._options.updatedAt)
        base.updatedAt = this._updatedAt(past, base.createdAt);
      const object = Object.assign(
        factory({ ...factoryFunctionOptions, ...base }),
        base
      );
      if (this._isValid(object, constraints)) {
        if (this._options.createdAt) this._lastCreatedAt = object.createdAt;
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

  _createdAt(past) {
    if (!past) return new Date().toISOString();
    const createdAt = this._lastCreatedAt == null
      ? faker.date.past()
      : faker.date.pastSince(this._lastCreatedAt);
    return createdAt.toISOString();
  }

  _updatedAt(past, createdAt) {
    if (!past || faker.random.boolean()) return null;
    const updatedAt = this._options.createdAt
      ? faker.date.pastSince(createdAt)
      : faker.date.past();
    return updatedAt.toISOString();
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
    if (this._factory.options().updatedAt) {
      // eslint-disable-next-line no-param-reassign
      object.updatedAt = new Date().toISOString();
    }
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
