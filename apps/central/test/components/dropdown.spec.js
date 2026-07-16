import TestDropdownMenu from '../util/components/dropdown-menu.vue';

import { mount } from '../util/lifecycle';

describe('Dropdown', () => {
  it('opens when toggle is clicked', async () => {
    const component = mount(TestDropdownMenu, { attachTo: document.body });
    component.find('.dropdown').classes('open').should.equal(false);
    await component.find('#toggle').trigger('click');
    component.find('.dropdown').classes('open').should.equal(true);
  });

  describe('closes', () => {
    const cases = [
      ['when toggle is clicked again', async (component) => {
        await component.find('#toggle').trigger('click');
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
        await component.find('#toggle').trigger('click');
        component.find('.dropdown').classes('open').should.equal(true);
        await action(component);
        component.find('.dropdown').classes('open').should.equal(false);
      });
    }
  });
});
