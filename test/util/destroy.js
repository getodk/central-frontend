import { mount } from 'avoriaz';

import store from '../../src/store';
import { setRequestData } from './store';

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
  setRequestData(requestData);
  const wrapper = mount(component, { ...mountOptions, store });
  markComponentForDestruction(wrapper);
  return wrapper;
};
