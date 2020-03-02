import store from '../../src/store';
import { transforms } from '../../src/store/modules/request/keys';

const successfulResponse = (data) => ({
  status: 200,
  data,
  get config() { throw new Error(); }
});
const problemResponse = (code) => ({
  status: Math.floor(code),
  data: { code, message: 'Problem' },
  get config() { throw new Error(); }
});

// eslint-disable-next-line import/prefer-default-export
export const setRequestData = (data) => {
  for (const [key, value] of Object.entries(data)) {
    const transform = transforms[key];
    if (transform == null && value.problem != null)
      throw new Error('unexpected problem response');
    const response = value.problem == null
      ? successfulResponse(value)
      : problemResponse(value);
    const transformed = transform != null ? transform(response) : response.data;
    store.commit('setData', { key, value: transformed });
  }
};
