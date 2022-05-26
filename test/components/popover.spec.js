import Popover from '../../src/components/popover.vue';

import TestUtilPopoverLinks from '../util/components/popover-links.vue';

import { mount } from '../util/lifecycle';

describe('Popover', () => {
  it('shows a popover after it is triggered', async () => {
    const component = mount(TestUtilPopoverLinks, { attachTo: document.body });
    document.querySelectorAll('.popover').length.should.equal(0);
    document.querySelector('#show-foo').click();
    await component.vm.$nextTick();
    await component.vm.$nextTick();
    const popovers = document.querySelectorAll('.popover');
    popovers.length.should.equal(1);
    popovers[0].querySelector('p').textContent.should.equal('foo');
  });

  it('hides the popover after a click outside the popover', async () => {
    const component = mount(TestUtilPopoverLinks, { attachTo: document.body });
    document.querySelector('#show-foo').click();
    await component.vm.$nextTick();
    await component.vm.$nextTick();
    document.querySelectorAll('.popover').length.should.equal(1);
    document.querySelector('#hide').click();
    await component.vm.$nextTick();
    document.querySelectorAll('.popover').length.should.equal(0);
  });

  it('does not hide the popover after a click on the popover', async () => {
    const component = mount(TestUtilPopoverLinks, { attachTo: document.body });
    document.querySelector('#show-foo').click();
    await component.vm.$nextTick();
    await component.vm.$nextTick();
    document.querySelectorAll('.popover').length.should.equal(1);
    document.querySelector('.popover p').click();
    await component.vm.$nextTick();
    document.querySelectorAll('.popover').length.should.equal(1);
  });

  it('does not hide popover after a click on the triggering element', async () => {
    const component = mount(TestUtilPopoverLinks, { attachTo: document.body });
    document.querySelector('#show-foo').click();
    await component.vm.$nextTick();
    await component.vm.$nextTick();
    document.querySelectorAll('.popover').length.should.equal(1);
    document.querySelector('#show-foo').click();
    await component.vm.$nextTick();
    document.querySelectorAll('.popover').length.should.equal(1);
    await component.vm.$nextTick();
    document.querySelectorAll('.popover').length.should.equal(1);
  });

  it('does not re-render popover after a click on the triggering element', async () => {
    const component = mount(TestUtilPopoverLinks, { attachTo: document.body });
    document.querySelector('#show-foo').click();
    await component.vm.$nextTick();
    await component.vm.$nextTick();
    const p = document.querySelector('.popover p');
    document.querySelector('#show-foo').click();
    await component.vm.$nextTick();
    await component.vm.$nextTick();
    document.querySelector('.popover p').should.equal(p);
  });

  it('shows a new popover after one is triggered', async () => {
    const component = mount(TestUtilPopoverLinks, { attachTo: document.body });
    document.querySelector('#show-foo').click();
    await component.vm.$nextTick();
    await component.vm.$nextTick();
    const popoversForFoo = document.querySelectorAll('.popover');
    popoversForFoo.length.should.equal(1);
    popoversForFoo[0].querySelector('p').textContent.should.equal('foo');
    document.querySelector('#show-bar').click();
    await component.vm.$nextTick();
    await component.vm.$nextTick();
    const popoversForBar = document.querySelectorAll('.popover');
    popoversForBar.length.should.equal(1);
    popoversForBar[0].querySelector('p').textContent.should.equal('bar');
  });

  it('updates the popover after update() is called', async () => {
    const component = mount(TestUtilPopoverLinks, { attachTo: document.body });
    document.querySelector('#show-foo').click();
    await component.vm.$nextTick();
    await component.vm.$nextTick();
    document.querySelector('.popover p').textContent.should.equal('foo');
    component.vm.popover.text = 'baz';
    await component.vm.$nextTick();
    // The Popover component updates automatically, but the .popover element
    // does not.
    const popoverComponent = component.getComponent(Popover);
    popoverComponent.get('p').text().should.equal('baz');
    document.querySelector('.popover p').textContent.should.equal('foo');
    popoverComponent.vm.update();
    document.querySelector('.popover p').textContent.should.equal('baz');
  });

  it('uses the placement prop', async () => {
    const component = mount(TestUtilPopoverLinks, { attachTo: document.body });
    document.querySelector('#show-foo').click();
    await component.vm.$nextTick();
    await component.vm.$nextTick();
    const popover = document.querySelector('.popover');
    popover.classList.contains('left').should.be.true();
  });
});
