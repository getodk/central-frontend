import EntityFiltersViewAs from '../../../../src/components/entity/filters/view-as.vue';

import useProject from '../../../../src/request-data/project';

import testData from '../../../data';
import { mount } from '../../../util/lifecycle';
import { testRequestData } from '../../../util/request-data';

const createFieldKeys = (count) => new Array(count).fill(undefined)
  .map((_, i) => testData.extendedFieldKeys
    .createPast(1, { displayName: `App User ${i}` })
    .last());

const mountComponent = (fieldKeys, options) => {
  if (testData.extendedDatasets.size === 0)
    testData.extendedDatasets.createPast(1, { accessFilter: { type: 'ownerOnly' } });
  const dataset = testData.extendedDatasets.last();
  return mount(EntityFiltersViewAs, {
    container: {
      requestData: testRequestData([useProject], { fieldKeys, dataset })
    },
    ...options
  });
};

describe('EntityFiltersViewAs', () => {
  it('does not render the select if the dataset has no access filter', () => {
    testData.extendedDatasets.createPast(1, { accessFilter: null });
    const component = mountComponent(createFieldKeys(1));
    component.find('select').exists().should.be.false;
  });

  it('renders a single-select input for each app user', async () => {
    const fieldKeys = createFieldKeys(2);
    const component = mountComponent(fieldKeys, { attachTo: document.body });
    await component.get('.dropdown-trigger').trigger('click');
    component.findAll('input[type="radio"]').length.should.equal(2);
  });

  it('emits an app user ID after selection is applied', async () => {
    const [fieldKey1, fieldKey2] = createFieldKeys(2);
    const component = mountComponent([fieldKey1, fieldKey2], {
      props: { modelValue: fieldKey1.id },
      attachTo: document.body
    });
    await component.get('.dropdown-trigger').trigger('click');
    await component.findAll('input[type="radio"]')[1].setValue(true);
    await component.get('.action-bar button').trigger('click');
    component.emitted('update:modelValue').should.eql([[fieldKey2.id]]);
  });

  it('emits null after Reset to Me is clicked', async () => {
    const [fieldKey] = createFieldKeys(1);
    const component = mountComponent([fieldKey], {
      props: { modelValue: fieldKey.id },
      attachTo: document.body
    });
    await component.get('.dropdown-trigger').trigger('click');
    await component.get('.change-all.single button').trigger('click');
    await component.get('.action-bar button').trigger('click');
    component.emitted('update:modelValue').should.eql([[null]]);
  });

  it('does not emit an event when Apply is clicked without a change', async () => {
    const [fieldKey] = createFieldKeys(1);
    const component = mountComponent([fieldKey], {
      props: { modelValue: fieldKey.id },
      attachTo: document.body
    });
    await component.get('.dropdown-trigger').trigger('click');
    await component.get('.action-bar button').trigger('click');
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
});
