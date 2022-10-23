/*
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { computed, inject, onUnmounted, provide, shallowReactive } from 'vue';
import { defineStore } from 'pinia';

import createResources from './resources';
import { createResource, resourceView } from './resource';

const createState = () =>
  shallowReactive({ data: null, awaitingResponse: false });
const patchMock = (f) => { f(); };
const defineResourceStore = process.env.NODE_ENV === 'development'
  ? (name) => defineStore(`requestData.${name}`, { state: createState })
  : () => {
    const store = createState();
    store.$patch = patchMock;
    return () => store;
  };

const composableKey = Symbol('requestData composable');

export const createRequestData = (container) => {
  // `resources` holds both app-wide resources and local resources.
  const resources = new Map();
  /* `stores` holds all the Pinia stores that have ever been created for a
  resource. Even after a local resource is removed from `resources` (when the
  component is unmounted), the resource's underlying store is not removed from
  `stores`. That's because we will reuse the store if another local resource is
  created with the same name. Doing so minimizes the number of stores shown in
  Vue Devtools. */
  const stores = new Map();

  // Create app-wide resources.
  const requestData = { resources: new Set() };
  const { pinia } = container;
  createResources(container, (name, setup) => {
    const useStore = defineResourceStore(name);
    stores.set(name, useStore);
    const resource = createResource(container, name, useStore(pinia), setup);
    resources.set(name, resource);
    requestData[name] = resource;
    requestData.resources.add(resource);
    return resource;
  });

  // Checking the collective state of multiple resources
  requestData.resourceStates = (resources) => ({ // eslint-disable-line no-shadow
    // Returns `true` if a group of resources is being initially loaded (not
    // refreshed). Returns `false` if there is a resource that is not loading
    // and also does not have data, because presumably its request resulted in
    // an error.
    initiallyLoading: computed(() =>
      resources.some(resource => resource.initiallyLoading) &&
      resources.every(resource => resource.awaitingResponse || resource.dataExists)),
    dataExists: computed(() => resources.every(resource => resource.dataExists))
  });

  // Local resources
  const createLocalResource = (name, setup) => {
    // Even local resources cannot share a name at the same time. That's because
    // the name is used for the id of the store.
    if (resources.has(name)) throw new Error(`the name ${name} is in use`);
    if (!stores.has(name)) {
      const useStore = defineResourceStore(name);
      stores.set(name, useStore);
    }
    const useStore = stores.get(name);
    const resource = createResource(container, name, useStore(), setup);
    resources.set(name, resource);
    // We provide the local resource; only descendant components will be able to
    // inject it.
    provide(`requestData.localResources.${name}`, resource);

    onUnmounted(() => {
      /*
      Resetting the resource will reset the state of the store, allowing the
      store to be reused if a local resource is created later with the same
      name.

      It's because we reset the resource that we use an `unmounted` hook rather
      than a beforeUnmount hook. If we used a beforeUnmount hook, then if the
      component used watchSyncEffect() with the resource, the watchSyncEffect()
      callback would be run after the resource was reset. That seems surprising,
      and accounting for that possibility could add complexity to the
      watchSyncEffect() callback and the component. (That said, using an
      `unmounted` hook does end up adding complexity to AsyncRoute.)
      */
      resource.reset();
      resources.delete(name);
    });

    return resource;
  };
  if (process.env.NODE_ENV === 'test') {
    // Normally, requestData only provides access to app-wide resources.
    // However, in testing, we sometimes need access outside components to local
    // resources.
    requestData.localResources = new Proxy({}, {
      get: (_, prop) => {
        const resource = resources.get(prop);
        return resource != null && !requestData.resources.has(resource)
          ? resource
          : undefined;
      }
    });
  }

  // Getters allow you to create a computed ref in one component, then access it
  // from useRequestData() in a descendant component. Getters are only really
  // needed for computed refs that reference multiple resources.
  const getters = new Map();
  const createGetter = (name, ref) => {
    // Unlike with resources, there's no real problem with different getters
    // using the same name. Supporting that case would just make managing
    // `getters` harder.
    if (getters.has(name)) throw new Error(`the name ${name} is in use`);
    getters.set(name, ref);
    provide(`requestData.getters.${name}`, ref);
    onUnmounted(() => { getters.delete(name); });
    return ref;
  };

  // useRequestData()
  const getResource = (name) => {
    const resource = resources.get(name);
    if (resource == null) return null;
    // If the resource is a local resource, check whether it was created by an
    // ancestor component.
    if (!requestData.resources.has(resource) &&
      inject(`requestData.localResources.${name}`) == null)
      return null;
    const useStore = stores.get(name);
    useStore();
    return resource;
  };
  const composable = new Proxy(
    {
      createResource: createLocalResource,
      resourceView: (name, lens) => {
        const resource = getResource(name);
        if (resource == null) throw new Error(`unknown resource ${name}`);
        return resourceView(resource, lens);
      },
      createGetter
    },
    {
      get: (target, prop) => {
        const resource = getResource(prop);
        if (resource != null) return resource;

        if (getters.has(prop)) {
          const getter = inject(`requestData.getters.${prop}`);
          if (getter != null) return getter;
        }

        return requestData[prop] != null ? requestData[prop] : target[prop];
      }
    }
  );

  requestData.install = (app) => {
    app.provide(composableKey, composable);

    // Provide local resources and getters for testing.
    for (const [name, resource] of resources.entries()) {
      if (!requestData.resources.has(resource))
        app.provide(`requestData.localResources.${name}`, resource);
    }
    for (const [name, getter] of getters.entries())
      app.provide(`requestData.getters.${name}`, getter);
  };

  return requestData;
};

export const useRequestData = () => inject(composableKey);
