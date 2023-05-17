import EntityMetadataRow from '../../../src/components/entity/metadata-row.vue';

import DateTime from '../../../src/components/date-time.vue';

import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = (props = undefined) => {
  const mergedProps = {
    entity: testData.entityOData().value[0],
    rowNumber: 1,
    ...props
  };
  return mount(EntityMetadataRow, {
    global: {
      provide: { projectId: '1', datasetName: 'trees' }
    },
    props: mergedProps,
    container: {
      router: mockRouter('/projects/1/datasets/trees/entities/e')
    }
  });
};

describe('EntityMetadataRow', () => {
  it('shows the row number', () => {
    testData.extendedDatasets.createPast(1);
    testData.extendedEntities.createPast(1);
    const td = mountComponent({ rowNumber: 1000 }).get('td');
    td.classes('row-number').should.be.true();
    td.text().should.equal('1000');
  });

  it('shows the creator name for an entity', async () => {
    testData.extendedDatasets.createPast(1);
    const creator = testData.extendedUsers.first();
    testData.extendedEntities.createPast(1, { creator }).last();
    const row = mountComponent();
    const td = row.findAll('td')[1];
    td.classes('creator-name').should.be.true();
    td.text().should.equal(creator.displayName);
    await td.get('span').should.have.textTooltip();
  });

  it('shows the creation date', () => {
    testData.extendedDatasets.createPast(1);
    const { createdAt } = testData.extendedEntities.createPast(1).last();
    mountComponent().getComponent(DateTime).props().iso.should.equal(createdAt);
  });
});
