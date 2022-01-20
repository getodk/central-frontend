import SubmissionFiltersSubmitter from '../../../../src/components/submission/filters/submitter.vue';

import testData from '../../../data';
import { mount } from '../../../util/lifecycle';

const mountComponent = ({ modelValue = '' } = {}) =>
  mount(SubmissionFiltersSubmitter, {
    props: { modelValue },
    container: {
      requestData: {
        submitters: testData.extendedFieldKeys
          .sorted()
          .sort((fieldKey1, fieldKey2) =>
            fieldKey1.displayName.localeCompare(fieldKey2.displayName))
          .map(testData.toActor)
      }
    }
  });

describe('SubmissionFiltersSubmitter', () => {
  it('renders the correct options', () => {
    const fieldKey1 = testData.extendedFieldKeys
      .createPast(1, { displayName: 'App User 1' })
      .last();
    const fieldKey2 = testData.extendedFieldKeys
      .createPast(1, { displayName: 'App User 2' })
      .last();
    const options = mountComponent().findAll('option');
    options[0].attributes().value.should.equal('');
    options[0].text().should.equal('(Anybody)');
    options[1].attributes().value.should.equal(fieldKey1.id.toString());
    options[1].text().should.equal('App User 1');
    options[2].attributes().value.should.equal(fieldKey2.id.toString());
    options[2].text().should.equal('App User 2');
  });

  it('sets the value of the select element to the modelValue prop', () => {
    const { id } = testData.extendedFieldKeys
      .createPast(1, 'App User 1')
      .last();
    const select = mountComponent({ modelValue: id.toString() }).get('select');
    select.element.value.should.equal(id.toString());
  });

  it('emits an update:modelValue event', () => {
    const { id } = testData.extendedFieldKeys
      .createPast(1, 'App User 1')
      .last();
    const component = mountComponent({ modelValue: '' });
    component.get('select').setValue(id.toString());
    component.emitted('update:modelValue').should.eql([[id.toString()]]);
  });
});
