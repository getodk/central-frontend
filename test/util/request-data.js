import { clone } from 'ramda';
import { mount as vtuMount } from '@vue/test-utils';

import { createRequestData, useRequestData } from '../../src/request-data';
import { noop } from '../../src/util/util';

import { mockLogin } from './session';
import { mockResponse } from './axios';

/*
Set the data of one or more resources by specifying either response data or a
full response for each resource. setRequestData() will take care of transforming
the response or response data. For example:

  setRequestData(requestData, {
    // Response data
    form: testData.extendedForms.last(),
    // Full response
    formDraft: mockResponse.problem(404.1)
  });
*/
export const setRequestData = (requestData, responsesOrData) => {
  for (const [name, responseOrData] of Object.entries(responsesOrData)) {
    const resource = requestData[name] != null
      ? requestData[name]
      : requestData.localResources[name];
    if (resource == null) throw new Error(`unknown resource ${name}`);
    const response = mockResponse.of(responseOrData);
    if (typeof response.data === 'object' && response.data != null)
      response.data = clone(response.data);
    resource.setFromResponse(response);
  }
  return requestData;
};

/* testRequestData() returns a function to create a requestData object for use
in testing. The requestData object can be set up with local resources or initial
data. First, specify local resources to create. For a resource that doesn't
require special setup, simply specify the resource's name. For more complex
resources, specify a composable. Next, optionally specify initial data: the
responses or response data specified will be passed to setRequestData(). */
export const testRequestData = (localResources, seedData = undefined) => (container) => {
  const requestData = createRequestData(container);

  const allSeedData = { ...seedData };
  /* If localResources.length !== 0, we will need to install the container on an
  app instance in order to create the local resources. However, `container` is
  currently only a partial container: it is still being created. That means that
  we have to wait until after the container is created to create the local
  resources. One idea might be to create the local resources when the container
  is installed on an app instance. However, that won't work, because the
  container may be used in a test that doesn't mount a component. Instead, here
  we define a method that will create the local resources and set requestData.
  createTestContainer() will call this method immediately after creating the
  container. */
  requestData.seed = (responsesOrData = undefined) => {
    if (responsesOrData != null) {
      Object.assign(allSeedData, responsesOrData);
      return;
    }

    if (localResources.length !== 0) {
      const composables = localResources.map(composableOrName =>
        (typeof composableOrName === 'function'
          ? composableOrName
          : () => {
            const { createResource } = useRequestData();
            createResource(composableOrName);
          }));
      // Using a strategy similar to withSetup(). (We can't use withSetup() here
      // because that would result in a cyclical dependency.)
      const setup = () => {
        for (const composable of composables)
          composable();
        return noop;
      };
      vtuMount({ setup }, {
        global: { plugins: [container] }
      });
    }

    mockLogin.setRequestData(requestData);
    setRequestData(requestData, allSeedData);
  };

  return requestData;
};
