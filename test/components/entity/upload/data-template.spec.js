import sinon from 'sinon';

import EntityUploadDataTemplate from '../../../../src/components/entity/upload/data-template.vue';

import testData from '../../../data';
import { mount } from '../../../util/lifecycle';

const mountComponent = () => mount(EntityUploadDataTemplate, {
  container: {
    requestData: { dataset: testData.extendedDatasets.last() }
  }
});

describe('EntityUploadDataTemplate', () => {
  it('has the correct data URL', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'hauteur' }, { name: 'circonférence' }]
    });
    const { href } = mountComponent().get('a').attributes();
    const expectedStart = 'data:text/csv;charset=UTF-8,\ufeff';
    href.should.startWith(expectedStart);
    const content = decodeURIComponent(href.replace(expectedStart, ''));
    content.should.equal('label,hauteur,circonférence');
  });

  it('has the correct filename', async () => {
    const clock = sinon.useFakeTimers(Date.parse('2024-12-31T01:23:45'));
    testData.extendedDatasets.createPast(1);
    const a = mountComponent().get('a');
    await a.trigger('click');
    a.attributes().download.should.equal('trees 20241231012345.csv');
    clock.tick(1000);
    await a.trigger('click');
    a.attributes().download.should.equal('trees 20241231012346.csv');
  });
});
