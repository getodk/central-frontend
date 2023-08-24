import DatasetTable from '../../../src/components/dataset/table.vue';
import DatasetRow from '../../../src/components/dataset/row.vue';

import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => mount(DatasetTable, {
  container: {
    requestData: testRequestData(['datasets'], {
      datasets: testData.extendedDatasets.sorted()
    }),
    router: mockRouter('/projects/1/entity-lists')
  }
});

describe('DatasetTable', () => {
  it('renders the correct number of rows', () => {
    testData.extendedDatasets.createPast(2);
    mountComponent().findAllComponents(DatasetRow).length.should.equal(2);
  });

  it('shows empty message when there is no dataset', () => {
    mountComponent().find('p').text().should.be.eql('No Entities have been created for this Project yet.');
  });
});
