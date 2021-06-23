import AuditFiltersAction from '../../../../src/components/audit/filters/action.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = ({ value = 'nonverbose' } = {}) =>
  mount(AuditFiltersAction, {
    propsData: { value }
  });

describe('AuditFiltersAction', () => {
  describe('options', () => {
    it('renders a category option correctly', () => {
      const option = mountComponent().get('option');
      option.text().should.equal('(All Actions)');
      option.attributes().value.should.equal('nonverbose');
      option.classes('audit-filters-action-category').should.be.true();
    });

    it('renders an action option correctly', () => {
      const option = mountComponent().findAll('option').at(2);
      option.element.textContent.should.containEql('\u00a0\u00a0\u00a0Create');
      const attributes = option.attributes();
      attributes.value.should.equal('user.create');
      should.not.exist(attributes.class);
    });

    it('renders option correctly for an action with multiple periods', () => {
      const option = mountComponent().findAll('option').at(14);
      option.element.textContent.should.containEql('\u00a0\u00a0\u00a0Create or Update Draft');
      const attributes = option.attributes();
      attributes.value.should.equal('form.update.draft.set');
      should.not.exist(attributes.class);
    });
  });

  it('sets the value of the select element to the value prop', () => {
    const select = mountComponent({ value: 'user' }).get('select');
    select.element.value.should.equal('user');
  });

  it('emits an input event', () => {
    const component = mountComponent({ value: 'nonverbose' });
    component.get('select').setValue('user');
    component.emitted().input.should.eql([['user']]);
  });
});
