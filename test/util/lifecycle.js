import { last, lensPath, view } from 'ramda';
import { mount as vtuMount } from '@vue/test-utils';

import { noop } from '../../src/util/util';
import vTooltip from '../../src/directives/tooltip';

import createTestContainer from './container';



////////////////////////////////////////////////////////////////////////////////
// MOUNT

/* For many components, it is no longer possible to access global properties
from the vm property of the Vue Test Utils wrapper: see
https://github.com/vuejs/test-utils/issues/2140. In practice, the only global
properties that we try to access in testing are $router and $route. We can
provide access to them by copying $router to each component, then computing
$route based on $router. */
const shadowRouterProps = {
  created() {
    // eslint-disable-next-line no-self-assign
    if (this.$router != null) this.$router = this.$router;
  },
  computed: {
    $route() {
      return this.$router != null ? this.$router.currentRoute.value : undefined;
    }
  }
};

/*
TODO/vue3. Update these comments.

Our mount() function is similar to mount() from Vue Test Utils. It automatically
specifies useful options to Vue Test Utils' mount(). It also accepts additional
options:

  - requestData. Passed to setData() before the component is mounted.
*/
export const mount = (component, options = {}) => {
  const { container: containerOption, global: g = {}, ...mountOptions } = options;
  const container = containerOption != null && containerOption.install != null
    ? containerOption
    : createTestContainer(containerOption);
  g.plugins = g.plugins != null ? [container, ...g.plugins] : [container];
  g.directives = { tooltip: vTooltip, ...g.directives };
  g.mocks = { $container: container, ...g.mocks };
  if (g.mixins != null) throw new Error('unexpected mixin');
  g.mixins = [shadowRouterProps];
  return vtuMount(component, { ...mountOptions, global: g });
};

const optionsToMerge = [
  ['props'],
  ['slots'],
  ['attrs'],
  ['global'],
  ['global', 'mocks'],
  ['global', 'provide'],
  ['global', 'stubs'],
  ['container']
];

// Merges two sets of options for mount().
export const mergeMountOptions = (options, defaults) => {
  if (options != null && options.container != null && defaults.container != null &&
    (options.container.install != null || defaults.container.install != null))
    throw new Error('cannot merge container options');
  const merged = { ...defaults, ...options };
  for (const path of optionsToMerge) {
    const viewPath = view(lensPath(path));
    const option = options != null ? viewPath(options) : undefined;
    const defaultOption = viewPath(defaults);
    if (option != null || defaultOption != null) {
      const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], merged);
      parent[last(path)] = { ...defaultOption, ...option };
    }
  }

  // Merge container.requestData.
  if (merged.container != null && merged.container.install == null) {
    const option = options != null && options.container != null
      ? options.container.requestData
      : undefined;
    const defaultOption = defaults.container != null
      ? defaults.container.requestData
      : undefined;
    if (option != null || defaultOption != null) {
      if (typeof option !== 'function' && typeof defaultOption !== 'function') {
        merged.container.requestData = { ...defaultOption, ...option };
      } else if (typeof option === 'function' && typeof defaultOption === 'function') {
        throw new Error('cannot merge requestData options');
      } else {
        const [factory, seedData] = typeof option === 'function'
          ? [option, defaultOption]
          : [defaultOption, option];
        merged.container.requestData = seedData == null
          ? factory
          : (container) => {
            const requestData = factory(container);
            requestData.seed(seedData);
            return requestData;
          };
      }
    }
  }

  return merged;
};

// withSetup() mounts a simple component whose setup() function will call f().
// The component will be mounted with the specified options, after which
// withSetup() will return the return value of f(). withSetup() is a useful way
// to test a composable that uses provide/inject or lifecycle hooks. See:
// https://vuejs.org/guide/scaling-up/testing.html#testing-composables
export const withSetup = (f, options = undefined) => {
  let result;
  const setup = () => {
    result = f();
    return noop;
  };
  mount({ setup }, options);
  return result;
};
