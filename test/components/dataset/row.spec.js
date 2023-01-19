import DatasetRow from '../../../src/components/dataset/row.vue';

import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(DatasetRow, {
  props: { dataset: testData.extendedDatasets.last() }
});

describe('DatasetRow', () => {
  it('shows the name', async () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset' });
    const span = mountComponent().get('.name span');
    span.text().should.equal('my_dataset');
    await span.should.have.textTooltip();
  });

  it('links to the CSV file', () => {
    testData.extendedDatasets.createPast(1, { name: 'my_dataset' });
    const { href } = mountComponent().get('a').attributes();
    href.should.equal('/v1/projects/1/datasets/my_dataset/entities.csv');
  });
});
