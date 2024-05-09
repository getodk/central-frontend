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
  it('shows the correct columns', async () => {
    testData.extendedDatasets.createPast(1);
    const table = mountComponent();
    const headers = table.findAll('th').map(th => th.text());
    headers.should.eql(['List Name', 'Total Entities', 'Latest Entity', 'Status', 'Actions']);
    table.findAll('td').length.should.equal(5);
  });

  it('renders the correct number of rows', () => {
    testData.extendedDatasets.createPast(2);
    mountComponent().findAllComponents(DatasetRow).length.should.equal(2);
  });

  it('shows empty message when there is no dataset', () => {
    mountComponent().find('p').text().should.be.eql('No Entities have been created for this Project yet.');
  });
});
