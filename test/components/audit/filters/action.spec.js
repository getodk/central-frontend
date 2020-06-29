import AuditFiltersAction from '../../../../src/components/audit/filters/action.vue';
import TestUtilVModel from '../../../util/components/v-model.vue';
import { mount } from '../../../util/lifecycle';
import { trigger } from '../../../util/event';

const mountComponent = ({ value = 'nonverbose', parent = false } = {}) => {
  if (parent) {
    const component = mount(TestUtilVModel, {
      propsData: { component: AuditFiltersAction, value }
    });
    return component.first(AuditFiltersAction);
  }
  return mount(AuditFiltersAction, {
    propsData: { value }
  });
};

describe('AuditFiltersAction', () => {
  it('shows the correct options', () => {
    const options = mountComponent().find('option');
    // Test one category option and one action option.
    options[0].text().trim().should.equal('(All Actions)');
    options[0].getAttribute('value').should.equal('nonverbose');
    options[0].hasClass('audit-filters-action-category').should.be.true();
    options[2].text().should.containEql('\u00a0\u00a0\u00a0Create');
    options[2].getAttribute('value').should.equal('user.create');
    options[2].hasAttribute('class').should.be.false();
  });

  it('sets the value of the select element to the value prop', () => {
    const select = mountComponent({ value: 'user' }).first('select');
    select.element.value.should.equal('user');
  });

  it('emits an input event', () => {
    const component = mountComponent({ value: 'nonverbose', parent: true });
    return trigger.changeValue(component, 'select', 'user').then(() => {
      component.getProp('value').should.equal('user');
    });
  });
});
