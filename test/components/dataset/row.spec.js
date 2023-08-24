import { RouterLinkStub } from '@vue/test-utils';

import DatasetRow from '../../../src/components/dataset/row.vue';

import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(DatasetRow, {
  props: { dataset: testData.extendedDatasets.last() },
  container: { router: mockRouter('/projects/1/entity-lists') }
});

describe('DatasetRow', () => {
  it('shows the name', async () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset' });
    const row = mountComponent();
    const link = row.getComponent(RouterLinkStub);
    link.props().to.should.equal('/projects/1/entity-lists/my_dataset');
    link.text().should.equal('my_dataset');
    await link.should.have.textTooltip();
  });

  it('shows the num of entities', () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset', entities: 10 });
    const row = mountComponent();
    row.get('.entities').text().should.be.eql('10');
  });

  it('formats the num of entities', () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset', entities: 1000 });
    const row = mountComponent();
    row.get('.entities').text().should.be.eql('1,000');
  });

  it('shows the newest entity timestamp', () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset', lastEntity: new Date().toISOString() });
    const row = mountComponent();
    row.get('time').text().should.be.containEql('today');
  });

  it('links to the CSV file', () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset' });
    const { href } = mountComponent().get('a.btn').attributes();
    href.should.equal('/v1/projects/1/datasets/my_dataset/entities.csv');
  });
});
