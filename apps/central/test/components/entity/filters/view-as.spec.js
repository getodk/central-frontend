import EntityFiltersViewAs from '../../../../src/components/entity/filters/view-as.vue';

import useProject from '../../../../src/request-data/project';

import testData from '../../../data';
import { mount } from '../../../util/lifecycle';
import { testRequestData } from '../../../util/request-data';

const createFieldKeys = (count) => new Array(count).fill(undefined)
  .map((_, i) => testData.extendedFieldKeys
    .createPast(1, { displayName: `App User ${i}` })
    .last());

const mountComponent = (fieldKeys, options) => mount(EntityFiltersViewAs, {
  container: { requestData: testRequestData([useProject], { fieldKeys }) },
  ...options
});
const toggle = (component) => component.get('.dropdown-trigger').trigger('click');
const apply = (component) => component.get('.action-bar button').trigger('click');
const assertDisabled = (component) => {
  component.get('.dropdown-trigger').attributes('aria-disabled').should.equal('true');
  component.get('.dropdown-trigger').attributes('aria-expanded').should.equal('false');
  component.get('.multiselect').classes().should.not.contain('open');
};

describe('EntityFiltersViewAs', () => {
  it('renders a radio for each app user', async () => {
    const fieldKeys = createFieldKeys(2);
    const component = mountComponent(fieldKeys, { attachTo: document.body });
    await toggle(component);
    component.findAll('input[type="radio"]').length.should.equal(2);
  });

  it('shows and checks the app user specified by modelValue', async () => {
    const [fieldKey1, fieldKey2] = createFieldKeys(2);
    const component = mountComponent([fieldKey1, fieldKey2], {
      props: { modelValue: fieldKey2.id },
      attachTo: document.body
    });
    component.get('.display-value').text().should.equal(fieldKey2.displayName);
    await toggle(component);
    component.findAll('input[type="radio"]')
      .map(input => input.element.checked).should.eql([false, true]);
  });

  it('emits an app user ID after selection is applied', async () => {
    const [fieldKey1, fieldKey2] = createFieldKeys(2);
    const component = mountComponent([fieldKey1, fieldKey2], {
      props: { modelValue: fieldKey1.id },
      attachTo: document.body
    });
    await toggle(component);
    await component.findAll('input[type="radio"]')[1].setValue(true);
    await apply(component);
    component.emitted('update:modelValue').should.eql([[fieldKey2.id]]);
  });

  it('emits null after Reset to Me is applied', async () => {
    const [fieldKey] = createFieldKeys(1);
    const component = mountComponent([fieldKey], {
      props: { modelValue: fieldKey.id },
      attachTo: document.body
    });
    await toggle(component);
    await component.get('.change-all.single button').trigger('click');
    await apply(component);
    component.emitted('update:modelValue').should.eql([[null]]);
  });

  it('does not emit an event when Apply is clicked without a change', async () => {
    const [fieldKey] = createFieldKeys(1);
    const component = mountComponent([fieldKey], {
      props: { modelValue: fieldKey.id },
      attachTo: document.body
    });
    await toggle(component);
    await apply(component);
    should.not.exist(component.emitted('update:modelValue'));
  });

  describe('display value', () => {
    it('shows the display name of the selected field key', () => {
      const [fieldKey] = createFieldKeys(1);
      const component = mountComponent([fieldKey], {
        props: { modelValue: fieldKey.id }
      });
      component.get('.display-value').text().should.equal(fieldKey.displayName);
    });

    it('shows default label if modelValue is null', () => {
      const [fieldKey] = createFieldKeys(1);
      const component = mountComponent([fieldKey], {
        props: { modelValue: null }
      });
      component.get('.display-value').text().should.equal('Me');
    });

    it('shows default label if the id is not in the field keys list', () => {
      const [fieldKey] = createFieldKeys(1);
      const component = mountComponent([], {
        props: { modelValue: fieldKey.id }
      });
      component.get('.display-value').text().should.equal('Me');
    });
  });

  it('filters app users by search text', async () => {
    const [fieldKey1, fieldKey2] = createFieldKeys(2);
    const component = mountComponent([fieldKey1, fieldKey2], { attachTo: document.body });
    await toggle(component);
    await component.get('.search input').setValue('0');
    component.findAll('.search-match label').map(label => label.text())
      .should.eql([fieldKey1.displayName]);
  });

  it('does not open when disabled', async () => {
    const component = mountComponent(createFieldKeys(1), {
      props: { disabled: true },
      attachTo: document.body
    });
    await toggle(component);
    assertDisabled(component);
  });
});
