import { last, lensPath, view } from 'ramda';
import { mount as vtuMount } from '@vue/test-utils';

import { $tcn } from '../../src/util/i18n';
import { noop } from '../../src/util/util';

import createTestContainer from './container';



////////////////////////////////////////////////////////////////////////////////
// MOUNT

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
  g.mocks = { $tcn, $container: container, ...g.mocks };
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
