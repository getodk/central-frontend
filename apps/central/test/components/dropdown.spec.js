import TestDropdownMenu from '../util/components/dropdown-menu.vue';

import { mount } from '../util/lifecycle';

describe('Dropdown', () => {
  it('provides attrs with aria attributes and dropdown-toggle class', async () => {
    const component = mount(TestDropdownMenu);
    const toggle = component.find('.dropdown-toggle');

    toggle.classes('dropdown-toggle').should.equal(true);
    toggle.attributes('aria-haspopup').should.equal('true');
    toggle.attributes('aria-expanded').should.equal('false');

    await toggle.trigger('click');
    toggle.attributes('aria-expanded').should.equal('true');
  });

  it('opens when toggle is clicked', async () => {
    const component = mount(TestDropdownMenu);
    component.find('.dropdown').classes('open').should.equal(false);
    await component.find('.dropdown-toggle').trigger('click');
    component.find('.dropdown').classes('open').should.equal(true);
  });

  it('sets aria-labelledby on menu to match trigger id', () => {
    const component = mount(TestDropdownMenu, { attachTo: document.body });
    const toggle = component.find('.dropdown-toggle');
    const menu = component.find('.dropdown-menu');
    const triggerId = toggle.attributes('id');
    triggerId.should.match(/^dropdown-/);
    menu.attributes('aria-labelledby').should.equal(triggerId);
  });

  describe('closes', () => {
    const cases = [
      ['when toggle is clicked again', async (component) => {
        await component.find('.dropdown-toggle').trigger('click');
      }],
      ['when clicking outside', async (component) => {
        await component.find('#outside').trigger('click');
      }],
      ['when clicking inside the menu', async (component) => {
        await component.find('#action1').trigger('click');
      }],
      ['on Escape key', async (component) => {
        await component.trigger('keydown', { key: 'Escape' });
      }]
    ];

    for (const [description, action] of cases) {
      it(description, async () => {
        const component = mount(TestDropdownMenu, { attachTo: document.body });
        await component.find('.dropdown-toggle').trigger('click');
        component.find('.dropdown').classes('open').should.equal(true);
        await action(component);
        component.find('.dropdown').classes('open').should.equal(false);
      });
    }
  });
});
