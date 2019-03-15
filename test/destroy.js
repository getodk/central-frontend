import { mount } from 'avoriaz';

import store from '../lib/store';

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

export const mountAndMark = (component, options = {}) => {
  const { requestData = {}, ...mountOptions } = options;
  for (const [key, value] of Object.entries(requestData))
    store.commit('setData', { key, value });
  const wrapper = mount(component, { ...mountOptions, store });
  markComponentForDestruction(wrapper);
  return wrapper;
};
