import store from '../../src/store';
import { transforms } from '../../src/store/modules/request/keys';

import { mockAxiosResponse } from './axios';

// eslint-disable-next-line import/prefer-default-export
export const setData = (data) => {
  for (const [key, value] of Object.entries(data)) {
    const transform = transforms[key];
    store.commit('setData', {
      key,
      value: transform == null ? value : transform(mockAxiosResponse(value))
    });
  }
};
