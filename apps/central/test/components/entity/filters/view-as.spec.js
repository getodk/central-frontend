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

describe('EntityFiltersViewAs', () => {
  it('passes the modelValue prop to the select', () => {
    const [fieldKey] = createFieldKeys(1);
    const component = mountComponent([fieldKey], {
      props: { modelValue: fieldKey.id }
    });
    component.get('select').element.value.should.equal(String(fieldKey.id));
  });

  it('passes a new value for modelValue prop to the select', async () => {
    const [fieldKey1, fieldKey2] = createFieldKeys(2);
    const component = mountComponent([fieldKey1, fieldKey2], {
      props: { modelValue: fieldKey1.id }
    });
    await component.setProps({ modelValue: fieldKey2.id });
    component.get('select').element.value.should.equal(String(fieldKey2.id));
  });

  it('emits an update:modelValue event if a field key is selected', async () => {
    const [fieldKey1, fieldKey2] = createFieldKeys(2);
    const component = mountComponent([fieldKey1, fieldKey2], {
      props: { modelValue: fieldKey1.id }
    });
    await component.get('select').setValue(String(fieldKey2.id));
    component.emitted('update:modelValue').should.eql([[fieldKey2.id]]);
  });

  it('does not emit an event if the same field key is selected', async () => {
    const [fieldKey] = createFieldKeys(1);
    const component = mountComponent([fieldKey], {
      props: { modelValue: fieldKey.id }
    });
    await component.get('select').setValue(String(fieldKey.id));
    should.not.exist(component.emitted('update:modelValue'));
  });

  describe('no user is selected', () => {
    it('emits null if the empty option is selected', async () => {
      const [fieldKey] = createFieldKeys(1);
      const component = mountComponent([fieldKey], {
        props: { modelValue: fieldKey.id }
      });
      await component.get('select').setValue('');
      component.emitted('update:modelValue').should.eql([[null]]);
    });

    it('does not emit an event if no user was already selected', async () => {
      const [fieldKey] = createFieldKeys(1);
      const component = mountComponent([fieldKey], {
        props: { modelValue: null }
      });
      await component.get('select').setValue('');
      should.not.exist(component.emitted('update:modelValue'));
    });
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
