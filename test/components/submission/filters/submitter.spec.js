import sinon from 'sinon';

import SubmissionFiltersSubmitter from '../../../../src/components/submission/filters/submitter.vue';

import testData from '../../../data';
import { mount } from '../../../util/lifecycle';
import { trigger } from '../../../util/event';

const mountComponent = ({ value = '' } = {}) =>
  mount(SubmissionFiltersSubmitter, {
    propsData: { value },
    requestData: {
      submitters: testData.extendedFieldKeys
        .sorted()
        .sort((fieldKey1, fieldKey2) =>
          fieldKey1.displayName.localeCompare(fieldKey2.displayName))
        .map(testData.toActor)
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
    const options = mountComponent().find('option');
    options[0].getAttribute('value').should.equal('');
    options[0].text().trim().should.equal('(Anybody)');
    options[1].getAttribute('value').should.equal(fieldKey1.id.toString());
    options[1].text().trim().should.equal('App User 1');
    options[2].getAttribute('value').should.equal(fieldKey2.id.toString());
    options[2].text().trim().should.equal('App User 2');
  });

  it('sets the value of the select element to the value prop', () => {
    const { id } = testData.extendedFieldKeys
      .createPast(1, 'App User 1')
      .last();
    const select = mountComponent({ value: id.toString() }).first('select');
    select.element.value.should.equal(id.toString());
  });

  it('emits an input event', () => {
    const { id } = testData.extendedFieldKeys
      .createPast(1, 'App User 1')
      .last();
    const component = mountComponent({ value: '' });
    const $emit = sinon.fake();
    sinon.replace(component.vm, '$emit', $emit);
    trigger.changeValue(component, 'select', id.toString());
    $emit.calledWith('input', id.toString()).should.be.true();
  });
});
