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
    const expectedStart = 'data:text/csv;charset=UTF-8,';
    href.should.startWith(expectedStart);
    const content = decodeURIComponent(href.replace(expectedStart, ''));
    content.should.equal('label,hauteur,circonférence');
  });

  it('has the correct filename', () => {
    testData.extendedDatasets.createPast(1);
    const { download } = mountComponent().get('a').attributes();
    download.should.equal('trees template.csv');
  });
});
