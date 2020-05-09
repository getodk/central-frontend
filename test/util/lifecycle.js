import { mount as avoriazMount } from 'avoriaz';

import i18n from '../../src/i18n';
import store from '../../src/store';
import { transforms } from '../../src/store/modules/request/keys';



////////////////////////////////////////////////////////////////////////////////
// DESTROY

let componentToDestroy = null;

export const markComponentForDestruction = (component) => {
  if (componentToDestroy != null)
    throw new Error('another component has already been marked for destruction and has not been destroyed yet');
  componentToDestroy = component;
};

export const destroyMarkedComponent = () => {
  if (componentToDestroy == null) return;
  componentToDestroy.vm.$destroy();
  if (componentToDestroy.vm.$el.parentNode != null)
    $(componentToDestroy.vm.$el).remove();
  componentToDestroy = null;
};



////////////////////////////////////////////////////////////////////////////////
// MOUNT

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
const setRequestData = (data) => {
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

export const mount = (component, options = {}) => {
  const { requestData, ...mountOptions } = options;
  if (requestData != null) setRequestData(requestData);
  mountOptions.store = store;
  mountOptions.i18n = i18n;
  const wrapper = avoriazMount(component, mountOptions);
  markComponentForDestruction(wrapper);
  return wrapper;
};

// Deprecated
export const mountAndMark = mount;
