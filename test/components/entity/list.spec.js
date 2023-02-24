import EntityDataRow from '../../../src/components/entity/data-row.vue';
import EntityList from '../../../src/components/entity/list.vue';
import EntityMetadataRow from '../../../src/components/entity/metadata-row.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('EntityList', () => {
  beforeEach(mockLogin);

  it('sends the correct requests for a dataset', () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    return load(
      '/projects/1/datasets/trees/entities',
      { root: false }
    ).testRequests([
      { url: '/v1/projects/1/datasets/trees.svc/Entities?%24count=true' }
    ]);
  });

  it('shows a message if there are no submissions', async () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    const component = await load(
      '/projects/1/datasets/trees/entities',
      { root: false }
    );
    component.getComponent(EntityList).get('.empty-table-message').should.be.visible();
  });

  describe('after the refresh button is clicked', () => {
    it('completes a background refresh', () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      const assertRowCount = (count) => (component) => {
        component.findAllComponents(EntityMetadataRow).length.should.equal(count);
        component.findAllComponents(EntityDataRow).length.should.equal(count);
      };
      return load('/projects/1/datasets/trees/entities', { root: false })
        .afterResponses(assertRowCount(1))
        .request(component =>
          component.get('#entity-list-refresh-button').trigger('click'))
        .beforeEachResponse(assertRowCount(1))
        .respondWithData(() => {
          testData.extendedEntities.createNew();
          return testData.entityOData();
        })
        .afterResponse(assertRowCount(2));
    });

    it('does not show a loading message', () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      return load('/projects/1/datasets/trees/entities', { root: false })
        .complete()
        .request(component =>
          component.get('#entity-list-refresh-button').trigger('click'))
        .beforeEachResponse(component => {
          component.get('.loading').should.be.hidden();
        })
        .respondWithData(testData.entityOData);
    });
  });
});
