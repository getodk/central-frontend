import DatasetRow from '../../../src/components/dataset/row.vue';

import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(DatasetRow, {
  props: { dataset: testData.extendedDatasets.last() }
});

describe('DatasetRow', () => {
  it('shows the name', () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset' });
    const span = mountComponent().get('.name span');
    span.text().should.equal('my_dataset');
    span.attributes().title.should.equal('my_dataset');
  });

  it('links to the CSV file', () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset' });
    const { href } = mountComponent().get('a').attributes();
    href.should.equal('/v1/projects/1/datasets/my_dataset/entities.csv');
  });
});
