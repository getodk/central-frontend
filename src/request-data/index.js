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
import { computed, inject, onUnmounted, provide } from 'vue';

import createResources from './resources';
import { createResource, resourceView } from './resource';

const composableKey = Symbol('requestData composable');

export const createRequestData = (container) => {
  // Create app-wide resources.
  const requestData = { resources: new Set() };
  createResources(container, (name, setup) => {
    if (name in requestData) throw new Error(`the name ${name} is in use`);
    const resource = createResource(container, name, setup);
    requestData[name] = resource;
    requestData.resources.add(resource);
    return resource;
  });

  // Checking the collective state of multiple resources
  requestData.resourceStates = (resources) => ({
    // Returns `true` if a group of resources is being initially loaded (not
    // refreshed). Returns `false` if there is a resource that is not loading
    // and also does not have data, because presumably its request resulted in
    // an error.
    initiallyLoading: computed(() =>
      resources.some(resource => resource.initiallyLoading) &&
      resources.every(resource => resource.awaitingResponse || resource.dataExists)),
    dataExists: computed(() => resources.every(resource => resource.dataExists))
  });

  // Add a mechanism to create local resources. Local resources do not have to
  // have names that are globally unique: different local resources can have the
  // same name at the same time. The localResources object keys by name, but it
  // is only used in testing and only in situations where that should be OK.
  const localResources = Object.create(null);
  const createLocalResource = (name, setup) => {
    const resource = createResource(container, name, setup);
    // We provide the local resource; only descendant components will be able to
    // inject it.
    provide(`requestData.localResources.${name}`, resource);
    localResources[name] = resource;

    onUnmounted(() => {
      // The resource is no longer needed, so we cancel any request still in
      // progress. We use onUnmounted() rather than onBeforeUnmount() in case
      // the component is watching resource.awaitingResponse synchronously for
      // some reason. We don't want to trigger a component watcher while the
      // component is being unmounted.
      resource.cancelRequest();

      // Remove `resource` from localResources unless it has already been
      // replaced.
      if (localResources[name] === resource) delete localResources[name];
    });

    return resource;
  };
  // Normally, requestData only provides access to app-wide resources. However,
  // in testing, we sometimes need access outside components to local resources.
  // For example, tests sometimes need to access local resources in order to
  // make assertions about them.
  if (process.env.NODE_ENV === 'test')
    requestData.localResources = localResources;

  // Getters allow you to create a computed ref in one component, then access it
  // from useRequestData() in a descendant component. Getters are very similar
  // to provide/inject, but they're a little easier to use in testing: getters
  // are automatically `provide`-d to components that are mounted in testing.
  // Getters are only really needed for computed refs that reference multiple
  // resources.
  const getters = Object.create(null);
  const createGetter = (name, f) => {
    const getter = computed(() => f(requestData));
    provide(`requestData.getters.${name}`, getter);
    getters[name] = getter;
    // eslint-disable-next-line vue/no-ref-as-operand
    onUnmounted(() => { if (getters[name] === getter) delete getters[name]; });
    return getter;
  };

  // useRequestData()
  const getResource = (name) => {
    const localResource = inject(`requestData.localResources.${name}`, null);
    if (localResource != null) return localResource;
    const value = requestData[name];
    return requestData.resources.has(value) ? value : null;
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
      get: (target, prop) => getResource(prop) ??
        inject(`requestData.getters.${prop}`, null) ??
        requestData[prop] ??
        target[prop]
    }
  );

  requestData.install = (app) => {
    app.provide(composableKey, composable);

    // Provide local resources and getters to a component being mounted in
    // testing.
    for (const [name, resource] of Object.entries(localResources))
      app.provide(`requestData.localResources.${name}`, resource);
    for (const [name, getter] of Object.entries(getters))
      app.provide(`requestData.getters.${name}`, getter);
  };

  return requestData;
};

export const useRequestData = () => inject(composableKey);
