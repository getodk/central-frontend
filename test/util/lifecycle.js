import { createLocalVue, mount as vtuMount } from '@vue/test-utils';
import { last, lensPath, view } from 'ramda';

import { $tcn } from '../../src/util/i18n';

import createTestContainer from './container';



////////////////////////////////////////////////////////////////////////////////
// DESTROY

const componentsToDestroy = [];

export const destroyAll = () => {
  for (const component of componentsToDestroy) {
    // Vue Test Utils always seems to create a parent component, so we also
    // destroy that. This is particularly important when the router is injected
    // into the component: see
    // https://github.com/vuejs/vue-test-utils/issues/1862
    const parent = component.vm.$parent;
    if (parent.$el.parentNode != null)
      parent.$el.parentNode.removeChild(parent.$el);
    // This will also destroy `component`.
    parent.$destroy();
  }
  componentsToDestroy.splice(0);
};



////////////////////////////////////////////////////////////////////////////////
// MOUNT

/*
TODO/vue3. Update these comments.

Our mount() function is similar to mount() from Vue Test Utils. It automatically
specifies useful options to Vue Test Utils' mount(). It also accepts additional
options:

  - requestData. Passed to setData() before the component is mounted.
  - throwIfEmit. A message to throw if the component emits an event. Used
    internally by load() when the `root` option is `false`.

Our mount() function will also set it up so that the component is destroyed
after the test.
*/
export const mount = (component, options = {}) => {
  const { props, global: g = {}, container: containerOption, requestData, throwIfEmit, ...mountOptions } = options;
  const container = containerOption != null && containerOption.install != null
    ? containerOption
    : createTestContainer({ requestData, ...containerOption });
  mountOptions.localVue = createLocalVue();
  mountOptions.localVue.use(container);
  mountOptions.localVue.prototype.$tcn = $tcn;
  if (props != null) mountOptions.propsData = props;
  mountOptions.mocks = { $container: container, ...g.mocks };
  mountOptions.stubs = g.stubs;
  mountOptions.provide = { ...container.provide, ...mountOptions.provide };

  /* Vue Test Utils doesn't seem to mount `component` as the root component:
  `component` seems to have a parent component that is the root component.
  However, if a component uses an i18n custom block, it falls back to the
  VueI18n instance of the root component. That means that we need to pass the
  root VueI18n instance (`i18n`) to the root component, which we can do using
  the parentComponent option. This can be helpful even if `component` itself
  doesn't use an i18n custom block, because a child component may use one. Since
  we are passing `i18n` to the parent component, it also feels right to pass
  `store`. */
  mountOptions.parentComponent = {
    store: container.store,
    i18n: container.i18n
  };
  if (container.router != null)
    mountOptions.parentComponent.router = container.router;

  const wrapper = vtuMount(component, mountOptions);
  componentsToDestroy.push(wrapper);

  if (throwIfEmit != null) {
    const emitted = wrapper.emitted();
    if (emitted != null) {
      let any = false;
      for (const [name, calls] of Object.entries(emitted)) {
        if (!name.startsWith('hook:')) {
          console.error(name, calls[0]); // eslint-disable-line no-console
          any = true;
        }
      }
      if (any) throw new Error(throwIfEmit);
    }
  }

  return wrapper;
};

// TODO/vue3. Update this list for Vue 3.
const optionsToMerge = [
  ['props'],
  ['propsData'],
  ['slots'],
  ['attrs'],
  ['provide'],
  ['global'],
  ['global', 'mocks'],
  ['global', 'stubs'],
  ['container'],
  ['container', 'requestData']
];

// Merges two sets of options for mount().
export const mergeMountOptions = (options, defaults) => {
  if (options == null) return defaults;
  const merged = { ...defaults, ...options };
  for (const path of optionsToMerge) {
    const lens = lensPath(path);
    const option = view(lens, options);
    if (option != null) {
      const defaultOption = view(lens, defaults);
      if (defaultOption != null) {
        const parent = path.slice(0, -1).reduce(
          (obj, prop) => obj[prop],
          merged
        );
        parent[last(path)] = { ...defaultOption, ...option };
      }
    }
  }
  return merged;
};
