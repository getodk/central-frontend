import { RouterLinkStub } from '@vue/test-utils';

import DatasetLink from '../../../src/components/dataset/link.vue';
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
    const link = mountComponent().getComponent(DatasetLink);
    link.props().should.eql({ projectId: 1, name: 'my_dataset' });
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
    row.get('time').text().should.include('today');
  });

  describe('conflicts', () => {
    it('shows empty cell if no conflicts', () => {
      testData.extendedDatasets.createPast(1, { name: 'my_dataset', conflicts: 0 });
      const row = mountComponent();
      row.find('.conflicts .icon-warning').exists().should.be.false;
      row.find('.conflicts').text().should.be.eql('');
    });

    it('shows the warning icon', () => {
      testData.extendedDatasets.createPast(1, { name: 'my_dataset', conflicts: 10 });
      const row = mountComponent();
      row.find('.icon-warning').exists().should.be.true;
    });

    it('shows the count of conflicts', () => {
      testData.extendedDatasets.createPast(1, { name: 'my_dataset', conflicts: 1 });
      const row = mountComponent();
      row.get('.conflicts').text().should.be.eql('1 possible conflict');
    });

    it('formats the count of conflicts', () => {
      testData.extendedDatasets.createPast(1, { name: 'my_dataset', conflicts: 1000 });
      const row = mountComponent();
      row.get('.conflicts').text().should.be.eql('1,000 possible conflicts');
    });

    it('links to the entities filtered by conflict', () => {
      testData.extendedDatasets.createPast(1, { name: 'my_dataset', conflicts: 10 });
      const cell = mountComponent().get('.conflicts');
      const link = cell.getComponent(RouterLinkStub);
      link.props().to.should.equal('/projects/1/entity-lists/my_dataset/entities?conflict=true');
      link.text().should.equal('10 possible conflicts');
    });
  });

  it('links to the CSV file', () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset' });
    const { href } = mountComponent().get('a.btn').attributes();
    href.should.equal('/v1/projects/1/datasets/my_dataset/entities.csv');
  });
});
