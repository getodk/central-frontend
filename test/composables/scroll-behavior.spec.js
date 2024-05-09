import { nextTick } from 'vue';

import { useScrollBehavior } from '../../src/scroll-behavior';

import { load } from '../util/http';
import { mockLogin } from '../util/session';
import { mount } from '../util/lifecycle';
import { wait } from '../util/util';

const Component = {
  template: `<div>
  <div v-for="(_, i) of new Array(5).fill(null)" :id="id(i)" style="height: 2000px;">
    Some text
  </div>
</div>`,
  setup() {
    const id = (i) => `div${i + 1}`;
    const scrollTo = useScrollBehavior();
    return { id, scrollTo };
  }
};
const mountComponent = async (hash = '#some_hash') => {
  const app = await load(`/${hash}`);
  return mount(Component, {
    container: app.vm.$container,
    attachTo: document.body
  });
};
const pxTo = (wrapper) => Math.floor(wrapper.element.getBoundingClientRect().y);

describe('useScrollBehavior()', () => {
  beforeEach(mockLogin);

  it('does not scroll if scrollTo() is not called', async () => {
    await mountComponent();
    // Scrolling doesn't seem to be synchronous, so we wait in order to give it
    // a chance to complete. (But we don't actually expect there to be any,
    // which we are about to assert.)
    await wait();
    window.scrollY.should.equal(0);
  });

  it('scrolls to an element in the DOM', async () => {
    const component = await mountComponent();
    component.vm.scrollTo(document.querySelector('#div2'));
    await wait();
    window.scrollY.should.be.above(0);
    pxTo(component.get('#div2')).should.equal(10);
  });

  it('scrolls when passed a CSS selector', async () => {
    const component = await mountComponent();
    component.vm.scrollTo('#div2');
    await wait();
    pxTo(component.get('#div2')).should.equal(10);
  });

  it('does not scroll for an element that does not exist', async () => {
    const component = await mountComponent();
    component.vm.scrollTo('#div1000');
    await wait();
    window.scrollY.should.equal(0);
  });

  it('scrolls at most once per navigation', async () => {
    const component = await mountComponent();
    component.vm.scrollTo('#div2');
    await wait();
    const yForDiv2 = window.scrollY;
    component.vm.scrollTo('#div3');
    await wait();
    window.scrollY.should.equal(yForDiv2);
    await component.vm.$router.push('/#foo');
    // Not sure why this tick is needed.
    await nextTick();
    component.vm.scrollTo('#div3');
    await wait();
    window.scrollY.should.be.above(yForDiv2);
    pxTo(component.get('#div3')).should.equal(10);
  });

  it('scrolls if there was no scroll after previous navigation', async () => {
    // Don't scroll after mounting (after the initial navigation). Wait until
    // after the next navigation.
    const component = await mountComponent();
    await component.vm.$router.push('/#foo');
    await nextTick();
    component.vm.scrollTo('#div2');
    await wait();
    pxTo(component.get('#div2')).should.equal(10);
  });

  it('ignores scrollTo() if there is no hash', async () => {
    const component = await mountComponent('');
    component.vm.scrollTo('#div2');
    await wait();
    window.scrollY.should.equal(0);
  });

  it('ignores scrollTo() if there is nothing after the hash', async () => {
    const component = await mountComponent('#');
    component.vm.scrollTo('#div2');
    await wait();
    window.scrollY.should.equal(0);
  });
});
