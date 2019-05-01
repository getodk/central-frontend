import store from '../../lib/store';
import { transforms } from '../../lib/store/modules/request';

const successfulResponse = (data) => ({
  status: 200,
  data,
  get config() { throw new Error(); }
});

// eslint-disable-next-line import/prefer-default-export
export const setRequestData = (data) => {
  for (const [key, value] of Object.entries(data)) {
    const transform = transforms[key];
    const transformed = transform != null
      ? transform(successfulResponse(value))
      : value;
    store.commit('setData', { key, value: transformed });
  }
};
