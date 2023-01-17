import { RouterLinkStub } from '@vue/test-utils';
import DatasetRow from '../../../src/components/dataset/row.vue';

import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(DatasetRow, {
  props: { dataset: testData.extendedDatasets.last() },
  global: {
    stubs: { RouterLink: RouterLinkStub }
  }
});

describe('DatasetRow', () => {
  it('shows the name', () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset' });
    const row = mountComponent();
    const link = row.get('.name a');
    link.text().should.equal('my_dataset');
    link.attributes().title.should.equal('my_dataset');
    const { to } = row.getComponent(RouterLinkStub).props();
    to.should.equal('/projects/1/datasets/my_dataset');
  });

  it('shows the num of entities and newest entity timestamp', () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset' });
    const row = mountComponent();
    row.get('.entities').text().should.be.greaterThanOrEqual(10);
    row.get('time').text().should.be.containEql('today');
  });

  it('links to the CSV file', () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset' });
    const { href } = mountComponent().get('a.btn').attributes();
    href.should.equal('/v1/projects/1/datasets/my_dataset/entities.csv');
  });
});
