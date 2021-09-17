import store from '../../src/store';
import { transforms } from '../../src/store/modules/request/keys';

import { mockResponse } from './axios';

/*
setData() sets request data in the store. After receiving either response data
or a full response for a particular request key, it calls the transform for the
key (if there is one), then stores the result. For example:

  setData({
    // Response data
    form: testData.extendedForms.last(),
    // Full response
    formDraft: mockResponse.problem(404.1)
  });
*/
// eslint-disable-next-line import/prefer-default-export
export const setData = (data) => {
  for (const [key, value] of Object.entries(data)) {
    const response = mockResponse.of(value);
    const transform = transforms[key];
    const transformed = transform != null ? transform(response) : response.data;
    store.commit('setData', { key, value: transformed });
  }
};
