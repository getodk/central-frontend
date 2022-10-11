import createCentralStore from '../../src/store';

import { mockLogin } from './session';
import { mockResponse } from './axios';

/*
setData() sets request data in the store. After receiving either response data
or a full response for a particular request key, it calls the transform for the
key (if there is one), then stores the result. For example:

  setData(store, {
    // Response data
    form: testData.extendedForms.last(),
    // Full response
    formDraft: mockResponse.problem(404.1)
  });
*/
export const setData = (store, data) => {
  for (const [key, value] of Object.entries(data))
    store.commit('setFromResponse', { key, response: mockResponse.of(value) });
};

export const testStore = (requestData) => (container) => {
  const store = createCentralStore(container);
  mockLogin.setRequestData(store);
  if (requestData != null) setData(store, requestData);
  return store;
};
