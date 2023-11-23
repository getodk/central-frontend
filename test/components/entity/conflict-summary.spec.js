import Confirmation from '../../../src/components/confirmation.vue';
import EntityConflictSummary from '../../../src/components/entity/conflict-summary.vue';

import useEntityVersions from '../../../src/request-data/entity-versions';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockHttp } from '../../util/http';
import { mockRouter } from '../../util/router';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => {
  const entity = testData.extendedEntities.last();
  return mergeMountOptions(options, {
    props: { entity },
    global: {
      provide: { projectId: '1', datasetName: 'trees' }
    },
    container: {
      requestData: testRequestData([useEntityVersions], {
        dataset: testData.extendedDatasets.last(),
        entityVersions: testData.extendedEntityVersions.sorted()
      }),
      router: mockRouter(`/projects/1/entity-lists/trees/entities/${entity.uuid}`)
    }
  });
};
const mountComponent = (options = undefined) =>
  mount(EntityConflictSummary, mountOptions(options));

describe('EntityConflictSummary', () => {
  it('show the confirmation modal', async () => {
    testData.extendedEntities.createPast(1);
    const component = await mountComponent();

    component.getComponent(Confirmation).props().state.should.be.false();
    await component.get('.btn-default').trigger('click');
    component.getComponent(Confirmation).props().state.should.be.true();
  });

  it('sends the correct request', async () => {
    testData.extendedEntities.createPast(1, { uuid: 'e' });
    return mockHttp()
      .mount(EntityConflictSummary, mountOptions())
      .request(async (component) => {
        await component.get('.btn-default').trigger('click');
        const modal = component.getComponent(Confirmation);
        await modal.get('.btn-danger').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'PATCH',
        url: '/v1/projects/1/datasets/trees/entities/e?resolve=true&baseVersion=1',
      }]);
  });

  describe('Resolve Conflict', () => {
    const resolve = () =>
      mockHttp()
        .mount(EntityConflictSummary, mountOptions())
        .request(async (component) => {
          await component.get('.btn-default').trigger('click');
          const modal = component.getComponent(Confirmation);
          await modal.get('.btn-danger').trigger('click');
        })
        .respondWithData(() => {
          testData.extendedEntities.resolve(-1);
          return testData.standardEntities.last();
        });

    it('should emit resolve', async () => {
      testData.extendedEntities.createPast(1);

      const component = await resolve();

      component.emitted().should.have.property('resolve');
    });

    it('should show alert', async () => {
      testData.extendedEntities.createPast(1);

      const component = await resolve();
      component.should.alert('success');
    });

    it('should hide confirmation modal', async () => {
      testData.extendedEntities.createPast(1);

      const component = await resolve();

      component.getComponent(Confirmation).props().state.should.be.false();
    });

    it('shows conflict error', () => {
      testData.extendedEntities.createPast(1);
      return mockHttp()
        .mount(EntityConflictSummary, mountOptions())
        .request(async (component) => {
          await component.get('.btn-default').trigger('click');
          const modal = component.getComponent(Confirmation);
          await modal.get('.btn-danger').trigger('click');
        })
        .respondWithProblem(409.15)
        .afterResponse(component => {
          component.should.alert('danger', (message) => {
            message.should.eql('Data has been modified by another user. Please refresh to see the updated data.');
          });
        });
    });
  });
});
