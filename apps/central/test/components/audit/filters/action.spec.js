import Multiselect from '../../../../src/components/multiselect.vue';
import AuditFiltersAction from '../../../../src/components/audit/filters/action.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = ({ modelValue = 'nonverbose' } = {}) =>
  mount(AuditFiltersAction, {
    props: { modelValue }
  });

describe('AuditFiltersAction', () => {
  describe('options', () => {
    it('renders the action groups in the expected order', () => {
      const groups = mountComponent().findAll('.option-group')
        .map(heading => heading.text());
      groups.should.eql([
        'Web User Actions',
        'Project Actions',
        'Form Actions',
        'App User Actions',
        'Public Access Link Actions',
        'Entity List Actions',
        'Server Configuration Actions',
        'Server Upgrade'
      ]);
    });

    it('passes a category option to the Multiselect', () => {
      const { options } = mountComponent().getComponent(Multiselect).props();
      options.find(({ value }) => value === 'user')
        .should.eql({ text: 'All', value: 'user', group: 'Web User Actions' });
    });

    it('passes an action option to the Multiselect', () => {
      const { options } = mountComponent().getComponent(Multiselect).props();
      options.find(({ value }) => value === 'user.create')
        .should.eql({ text: 'Create', value: 'user.create', group: 'Web User Actions' });
    });

    it('passes an action with multiple periods to the Multiselect', () => {
      const { options } = mountComponent().getComponent(Multiselect).props();
      options.find(({ value }) => value === 'form.update.draft.set')
        .should.eql({
          text: 'Create or Update Draft',
          value: 'form.update.draft.set',
          group: 'Form Actions'
        });
    });
  });

  describe('placeholder', () => {
    it('shows all actions when no action is selected', () => {
      mountComponent().get('.display-value').text().should.equal('All Actions');
    });

    it('shows the category when a category is selected', () => {
      mountComponent({ modelValue: 'user' })
        .get('.display-value')
        .text()
        .should.equal('Web User Actions');
    });

    it('shows the action when an action is selected', () => {
      mountComponent({ modelValue: 'user.create' })
        .get('.display-value')
        .text()
        .should.equal('Create');
    });
  });

  it('passes the selected value to the Multiselect as an array', () => {
    const multiselect = mountComponent({ modelValue: 'user' }).getComponent(Multiselect);
    multiselect.props().modelValue.should.eql(['user']);
  });

  it('passes an empty selection to the Multiselect for nonverbose', () => {
    const multiselect = mountComponent().getComponent(Multiselect);
    multiselect.props().modelValue.should.eql([]);
  });

  it('emits the selected action as the value', async () => {
    const component = mountComponent();
    const { options } = component.getComponent(Multiselect).props();
    const index = options.findIndex(({ value }) => value === 'user');
    await component.get('.dropdown-trigger').trigger('click');
    await component.get(`input[data-index="${index}"]`).setValue();
    component.emitted('update:modelValue').should.eql([['user']]);
  });

  it('emits nonverbose when no value is selected', async () => {
    const component = mountComponent({ modelValue: 'user' });
    await component.get('.dropdown-trigger').trigger('click');
    await component.get('.change-all.single .select-none').trigger('click');
    component.emitted('update:modelValue').should.eql([['nonverbose']]);
  });
});
