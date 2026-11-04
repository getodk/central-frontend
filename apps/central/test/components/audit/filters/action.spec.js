import AuditFiltersAction from '../../../../src/components/audit/filters/action.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = ({ modelValue = 'nonverbose' } = {}) =>
  mount(AuditFiltersAction, {
    props: { modelValue }
  });

describe('AuditFiltersAction', () => {
  describe('options', () => {
    it('renders a category option correctly', () => {
      const option = mountComponent().get('input[data-index="0"]');
      option.element.parentElement.textContent.should.equal('All Web User Actions');
    });

    it('renders an action option correctly', () => {
      const option = mountComponent().get('input[data-index="1"]');
      option.element.parentElement.textContent.should.include('Create');
    });

    it('renders option correctly for an action with multiple periods', () => {
      const option = mountComponent().get('input[data-index="15"]');
      option.element.parentElement.textContent.should.include('Create or Update Draft');
    });
  });

  it('sets the selected radio to the modelValue prop', async () => {
    const component = mountComponent({ modelValue: 'user' });
    await component.get('.dropdown-trigger').trigger('click');
    const option = component.get('input[data-index="0"]');
    option.element.checked.should.be.true;
  });

  it('emits an update:modelValue event', () => {
    const component = mountComponent({ modelValue: 'nonverbose' });
    component.get('input[data-index="0"]').setValue();
    component.emitted('update:modelValue').should.eql([['user']]);
  });
});
