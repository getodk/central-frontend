import AsyncRoute from '../../src/components/async-route.vue';
import Loading from '../../src/components/loading.vue';
import PageBody from '../../src/components/page/body.vue';
import TestUtilIcon from '../util/components/icon.vue';
import TestUtilP from '../util/components/p.vue';
import TestUtilSpan from '../util/components/span.vue';
import { loadedAsync, setLoader } from '../../src/util/async-components';
import { mount } from '../util/lifecycle';
import { wait, waitUntil } from '../util/util';

const mountComponent = (propsData) => mount(AsyncRoute, {
  propsData: {
    props: {},
    loading: 'tab',
    k: '0',
    ...propsData
  }
});

describe('AsyncRoute', () => {
  it('renders the async component', async () => {
    setLoader('MyComponent', async () => ({ default: TestUtilP }));
    const asyncRoute = mountComponent({ componentName: 'MyComponent' });
    await wait();
    asyncRoute.find(TestUtilP).length.should.equal(1);
  });

  it('passes the props to the component', async () => {
    setLoader('MyComponent', async () => ({ default: TestUtilIcon }));
    const asyncRoute = mountComponent({
      componentName: 'MyComponent',
      props: { icon: 'angle-right' }
    });
    await wait();
    asyncRoute.find('.icon-angle-right').length.should.equal(1);
  });

  describe('loading message', () => {
    it('renders correctly for a page', async () => {
      setLoader('MyComponent', async () => ({ default: TestUtilP }));
      const asyncRoute = mountComponent({
        componentName: 'MyComponent',
        loading: 'page'
      });
      const state = asyncRoute.first(PageBody).first(Loading).getProp('state');
      state.should.be.true();
      await wait();
      asyncRoute.find(Loading).length.should.equal(0);
    });

    it('renders correctly for a tab', async () => {
      setLoader('MyComponent', async () => ({ default: TestUtilP }));
      const asyncRoute = mountComponent({
        componentName: 'MyComponent',
        loading: 'tab'
      });
      asyncRoute.first(Loading).getProp('state').should.be.true();
      await wait();
      asyncRoute.first(Loading).getProp('state').should.be.false();
    });
  });

  it('re-renders the component if the k prop changes', async () => {
    setLoader('MyComponent', async () => ({ default: TestUtilP }));
    const asyncRoute = mountComponent({ componentName: 'MyComponent', k: '0' });
    await wait();
    const { vm } = asyncRoute.first(TestUtilP);
    asyncRoute.setProps({ k: '1' });
    await asyncRoute.vm.$nextTick();
    asyncRoute.first(TestUtilP).vm.should.not.equal(vm);
  });

  describe('after a load error', () => {
    it('shows a danger alert', async () => {
      setLoader('MyComponent', () => Promise.reject());
      const asyncRoute = mountComponent({ componentName: 'MyComponent' });
      await wait();
      const { alert } = asyncRoute.vm.$store.state;
      alert.type.should.equal('danger');
      alert.state.should.be.true();
    });

    it('does not show a loading message', async () => {
      setLoader('MyComponent', () => Promise.reject());
      const asyncRoute = mountComponent({ componentName: 'MyComponent' });
      await wait();
      asyncRoute.first(Loading).getProp('state').should.be.false();
    });

    it('does not show an alert if AsyncRoute component has been destroyed', async () => {
      setLoader('MyComponent', () => Promise.reject());
      const asyncRoute = mountComponent({ componentName: 'MyComponent' });
      asyncRoute.destroy();
      await wait();
      asyncRoute.vm.$store.state.alert.state.should.be.false();
    });
  });

  describe('after the componentName prop changes', () => {
    it('shows a loading message', async () => {
      setLoader('First', async () => ({ default: TestUtilP }));
      setLoader('Second', async () => ({ default: TestUtilSpan }));
      const asyncRoute = mountComponent({ componentName: 'First', k: '0' });
      await wait();
      asyncRoute.setProps({ componentName: 'Second', props: {}, k: '1' });
      await asyncRoute.vm.$nextTick();
      asyncRoute.first(Loading).getProp('state').should.be.true();
      await wait();
      asyncRoute.first(Loading).getProp('state').should.be.false();
    });

    it('renders the new component', async () => {
      setLoader('First', async () => ({ default: TestUtilP }));
      setLoader('Second', async () => ({ default: TestUtilSpan }));
      const asyncRoute = mountComponent({ componentName: 'First', k: '0' });
      await wait();
      asyncRoute.setProps({ componentName: 'Second', props: {}, k: '1' });
      await wait();
      asyncRoute.find(TestUtilSpan).length.should.equal(1);
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
        asyncRoute.find(TestUtilP).length.should.equal(0);
        asyncRoute.setProps({ componentName: 'Second', props: {}, k: '1' });
        await waitUntil(() => loadedAsync('First'));
        asyncRoute.find(TestUtilSpan).length.should.equal(1);
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
        asyncRoute.vm.$store.state.alert.state.should.be.false();
      });
    });
  });
});
