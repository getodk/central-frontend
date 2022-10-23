import AsyncRoute from '../../src/components/async-route.vue';
import Loading from '../../src/components/loading.vue';
import PageBody from '../../src/components/page/body.vue';

import TestUtilIcon from '../util/components/icon.vue';
import TestUtilP from '../util/components/p.vue';
import TestUtilSpan from '../util/components/span.vue';

import { loadedAsync, setLoader } from '../../src/util/load-async';

import { mount } from '../util/lifecycle';
import { wait, waitUntil } from '../util/util';

const mountComponent = (props) => mount(AsyncRoute, {
  props: {
    props: {},
    loading: 'tab',
    k: '0',
    ...props
  }
});

describe('AsyncRoute', () => {
  it('renders the async component', async () => {
    setLoader('MyComponent', async () => ({ default: TestUtilP }));
    const asyncRoute = mountComponent({ componentName: 'MyComponent' });
    await wait();
    asyncRoute.findComponent(TestUtilP).exists().should.be.true();
  });

  it('passes the props to the component', async () => {
    setLoader('MyComponent', async () => ({ default: TestUtilIcon }));
    const asyncRoute = mountComponent({
      componentName: 'MyComponent',
      props: { icon: 'angle-right' }
    });
    await wait();
    asyncRoute.find('.icon-angle-right').exists().should.be.true();
  });

  describe('loading message', () => {
    it('renders correctly for a page', async () => {
      setLoader('MyComponent', async () => ({ default: TestUtilP }));
      const asyncRoute = mountComponent({
        componentName: 'MyComponent',
        loading: 'page'
      });
      const { state } = asyncRoute.getComponent(PageBody).getComponent(Loading).props();
      state.should.be.true();
      await wait();
      asyncRoute.findComponent(Loading).exists().should.be.false();
    });

    it('renders correctly for a tab', async () => {
      setLoader('MyComponent', async () => ({ default: TestUtilP }));
      const asyncRoute = mountComponent({
        componentName: 'MyComponent',
        loading: 'tab'
      });
      asyncRoute.getComponent(Loading).props().state.should.be.true();
      await wait();
      asyncRoute.getComponent(Loading).props().state.should.be.false();
    });
  });

  it('re-renders the component if the k prop changes', async () => {
    setLoader('MyComponent', async () => ({ default: TestUtilP }));
    const asyncRoute = mountComponent({ componentName: 'MyComponent', k: '0' });
    await wait();
    const { vm } = asyncRoute.getComponent(TestUtilP);
    await asyncRoute.setProps({ k: '1' });
    await asyncRoute.vm.$nextTick();
    await asyncRoute.vm.$nextTick();
    should(asyncRoute.getComponent(TestUtilP).vm).not.equal(vm);
  });

  describe('after a load error', () => {
    it('shows a danger alert', async () => {
      setLoader('MyComponent', () => Promise.reject());
      const asyncRoute = mountComponent({ componentName: 'MyComponent' });
      await wait();
      asyncRoute.should.alert('danger');
    });

    it('does not show a loading message', async () => {
      setLoader('MyComponent', () => Promise.reject());
      const asyncRoute = mountComponent({ componentName: 'MyComponent' });
      await wait();
      asyncRoute.getComponent(Loading).props().state.should.be.false();
    });

    it('does not show an alert if AsyncRoute component has been unmounted', async () => {
      setLoader('MyComponent', () => Promise.reject());
      const asyncRoute = mountComponent({ componentName: 'MyComponent' });
      asyncRoute.unmount();
      await wait();
      asyncRoute.should.not.alert();
    });
  });

  describe('after the componentName prop changes', () => {
    it('shows a loading message', async () => {
      setLoader('First', async () => ({ default: TestUtilP }));
      setLoader('Second', async () => ({ default: TestUtilSpan }));
      const asyncRoute = mountComponent({ componentName: 'First', k: '0' });
      await wait();
      await asyncRoute.setProps({ componentName: 'Second', props: {}, k: '1' });
      asyncRoute.getComponent(Loading).props().state.should.be.true();
      await wait();
      asyncRoute.getComponent(Loading).props().state.should.be.false();
    });

    it('renders the new component', async () => {
      setLoader('First', async () => ({ default: TestUtilP }));
      setLoader('Second', async () => ({ default: TestUtilSpan }));
      const asyncRoute = mountComponent({ componentName: 'First', k: '0' });
      await wait();
      asyncRoute.setProps({ componentName: 'Second', props: {}, k: '1' });
      await wait();
      asyncRoute.findComponent(TestUtilSpan).exists().should.be.true();
    });

    describe('first component finishes loading after the second', () => {
      it('renders the new component', async () => {
        setLoader('First', async () => {
          await waitUntil(() => loadedAsync('Second'));
          return { default: TestUtilP };
        });
        setLoader('Second', async () => ({ default: TestUtilSpan }));
        const asyncRoute = mountComponent({ componentName: 'First', k: '0' });
        await wait();
        asyncRoute.findComponent(TestUtilP).exists().should.be.false();
        asyncRoute.setProps({ componentName: 'Second', props: {}, k: '1' });
        await waitUntil(() => loadedAsync('First'));
        asyncRoute.findComponent(TestUtilSpan).exists().should.be.true();
      });

      it('does not show an alert for the first component', async () => {
        setLoader('First', async () => {
          await waitUntil(() => loadedAsync('Second'));
          return Promise.reject();
        });
        setLoader('Second', async () => ({ default: TestUtilSpan }));
        const asyncRoute = mountComponent({ componentName: 'First', k: '0' });
        await wait();
        asyncRoute.setProps({ componentName: 'Second', props: {}, k: '1' });
        await waitUntil(() => loadedAsync('Second'));
        await wait();
        asyncRoute.should.not.alert();
      });
    });
  });
});
