import AuditFiltersAction from '../../../../src/components/audit/filters/action.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = ({ modelValue = 'nonverbose' } = {}) =>
  mount(AuditFiltersAction, {
    props: { modelValue }
  });

describe('AuditFiltersAction', () => {
  describe('options', () => {
    it('renders a category option correctly', () => {
      const option = mountComponent().get('option[value="nonverbose"]');
      option.text().should.equal('(All Actions)');
      option.classes('audit-filters-action-category').should.be.true();
    });

    it('renders an action option correctly', () => {
      const option = mountComponent().get('option[value="user.create"]');
      option.element.textContent.should.containEql('\u00a0\u00a0\u00a0Create');
      option.classes().should.eql([]);
    });

    it('renders option correctly for an action with multiple periods', () => {
      const option = mountComponent().get('option[value="form.update.draft.set"]');
      option.element.textContent.should.containEql('\u00a0\u00a0\u00a0Create or Update Draft');
      option.classes().should.eql([]);
    });
  });

  it('sets the value of the select element to the modelValue prop', () => {
    const select = mountComponent({ modelValue: 'user' }).get('select');
    select.element.value.should.equal('user');
  });

  it('emits an update:modelValue event', () => {
    const component = mountComponent({ modelValue: 'nonverbose' });
    component.get('select').setValue('user');
    component.emitted('update:modelValue').should.eql([['user']]);
  });
});
