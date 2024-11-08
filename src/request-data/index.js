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
import { computed, inject, onBeforeUnmount, onUnmounted, provide } from 'vue';

import createResources from './resources';
import { createResource, resourceView } from './resource';

const composableKey = Symbol('requestData composable');

export const createRequestData = (container) => {
  // `resources` holds both app-wide resources and local resources.
  const resources = new Map();

  // Create app-wide resources.
  const requestData = { resources: new Set() };
  createResources(container, (name, setup) => {
    const resource = createResource(container, name, setup);
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
    if (resources.has(name)) throw new Error(`the name ${name} is in use`);
    const resource = createResource(container, name, setup);
    resources.set(name, resource);
    // We provide the local resource; only descendant components will be able to
    // inject it.
    provide(`requestData.localResources.${name}`, resource);

    onUnmounted(() => {
      // The resource is no longer needed, so we cancel any request still in
      // progress. We use onUnmounted() rather than onBeforeUnmount() in case
      // the component is watching resource.awaitingResponse synchronously for
      // some reason. We don't want to trigger a component watcher while the
      // component is being unmounted.
      resource.cancelRequest();
    });
    onBeforeUnmount(() => {
      /*
      This needs to be run in onBeforeUnmount(), not onUnmounted(). In
      AsyncRoute, we see the following lifecycle stages:

        - `beforeUnmount` for the old component
        - `setup` for the new component
        - `unmounted` for the old component

      We need to delete `resource` from `resources` before the new component is
      set up, in case the new component creates a local resource with the same
      name.
      */
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
    if (getters.has(name)) throw new Error(`the name ${name} is in use`);
    getters.set(name, ref);
    provide(`requestData.getters.${name}`, ref);
    onBeforeUnmount(() => { getters.delete(name); });
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
