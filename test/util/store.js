import store from '../../src/store';
import { transforms } from '../../src/store/modules/request';

const successfulResponse = (data) => ({
  status: 200,
  data,
  get config() { throw new Error(); }
});

// eslint-disable-next-line import/prefer-default-export
export const setRequestData = (data) => {
  for (const [key, value] of Object.entries(data)) {
    const transform = transforms[key];
    const response = value.status != null ? value : successfulResponse(value);
    const success = response.status >= 200 && response.status < 300;
    if (transform == null && !success)
      throw new Error('unexpected error response');
    const transformed = transform != null ? transform(response) : response.data;
    store.commit('setData', { key, value: transformed });
  }
};
