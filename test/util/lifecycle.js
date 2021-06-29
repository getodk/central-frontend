import { mount as vtuMount } from '@vue/test-utils';

import i18n from '../../src/i18n';
import router from '../../src/router';
import store from '../../src/store';

import localVues from './local-vue';
import { setData } from './store';



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

export const mount = (component, options = {}) => {
  const { requestData, throwIfEmit, ...mountOptions } = options;

  /* Vue Test Utils doesn't seem to mount `component` as the root component:
  `component` seems to have a parent component that is the root component.
  However, if a component uses an i18n custom block, it falls back to the
  VueI18n instance of the root component. That means that we need to pass the
  root VueI18n instance (`i18n`) to the root component, which we can do using
  the parentComponent option. This can be helpful even if `component` itself
  doesn't use an i18n custom block, because a child component may use one. Since
  we're passing `i18n` to the parent component, it also felt right to pass
  `store`. */
  mountOptions.parentComponent = { store, i18n };

  if (requestData != null) setData(requestData);

  if (mountOptions.router != null) {
    mountOptions.localVue = localVues.withRouter;
    mountOptions.parentComponent.router = mountOptions.router;
    delete mountOptions.router;
  } else {
    mountOptions.localVue = localVues.withoutRouter;

    if (mountOptions.mocks != null && mountOptions.mocks.$route != null) {
      /* mount() makes it easy to mock $route: if you specify a string location,
      mount() will convert it to a Route object. Because it is so common for
      $route and $router to be used together, if you specify $route without
      $router, then mount() will pass a minimal mock of $router with read-only
      functionality. If you need additional router functionality, you should
      probably inject the router. */
      const mocks = { ...mountOptions.mocks };
      if (typeof mocks.$route === 'string')
        mocks.$route = router.resolve(mocks.$route).route;
      if (mocks.$router == null) {
        mocks.$router = {
          currentRoute: mocks.$route,
          resolve: router.resolve.bind(router)
        };
      }
      mountOptions.mocks = mocks;
      store.commit('confirmNavigation', mocks.$route);
    }
  }

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
