import { last, lensPath, view } from 'ramda';
import { mount as vtuMount } from '@vue/test-utils';

import createTestContainer from './container';

/*
Our mount() function is similar to mount() from Vue Test Utils. It automatically
creates application-wide objects and passes them to Vue Test Utils' mount()
using the `global` option. It also accepts these additional `global` options:

  - global
    - router (optional). By default, our mount() function does not install a
      router. To install a real router, specify `true`. You can also specify a
      mock router: doing so will mock $router and $route and stub <router-link>
      and <router-view>. To learn more about testing strategies related to the
      router, see test/util/http.js.
    - requestData (optional). Passed to setData() before the component is
      mounted.
*/
export const mount = (component, options = {}) => {
  const { container, ...vtuOptions } = options;
  vtuOptions.global = {
    ...vtuOptions.global,
    plugins: [container.install != null ? container : createTestContainer(container)],
  };
  return vtuMount(component, vtuOptions);
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
        let obj = merged;
        for (let i = 0; i < path.length - 1; i += 1)
          obj = obj[path[i]];
        obj[last(path)] = { ...defaultOption, ...option };
      }
    }
  }
  return merged;
};
