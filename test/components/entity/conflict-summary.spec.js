import Confirmation from '../../../src/components/confirmation.vue';
import EntityConflictSummary from '../../../src/components/entity/conflict-summary.vue';

import useEntity from '../../../src/request-data/entity';
import useEntityVersions from '../../../src/request-data/entity-versions';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => {
  const entity = testData.extendedEntities.last();
  return mergeMountOptions(options, {
    global: {
      provide: { projectId: '1', datasetName: 'trees' }
    },
    container: {
      requestData: testRequestData([useEntity, useEntityVersions], {
        project: testData.extendedProjects.last(),
        dataset: testData.extendedDatasets.last(),
        entity,
        entityVersions: testData.extendedEntityVersions.sorted()
      }),
      router: mockRouter(`/projects/1/entity-lists/trees/entities/${entity.uuid}`)
    }
  });
};
const mountComponent = (options = undefined) =>
  mount(EntityConflictSummary, mountOptions(options));

describe('EntityConflictSummary', () => {
  it('does not show the footer to a project viewer', () => {
    mockLogin({ role: 'none' });
    testData.extendedProjects.createPast(1, { role: 'viewer', datasets: 1 });
    testData.extendedEntities.createPast(1);
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    const component = mountComponent();
    component.find('.panel-footer').exists().should.be.false;
    component.find('.btn-default').exists().should.be.false;
  });

  it('show the confirmation modal', async () => {
    testData.extendedEntities.createPast(1);
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    const component = mountComponent();
    component.getComponent(Confirmation).props().state.should.be.false;
    await component.get('.btn-default').trigger('click');
    component.getComponent(Confirmation).props().state.should.be.true;
  });

  it('sends the correct request', async () => {
    testData.extendedEntities.createPast(1, { uuid: 'e' });
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    return mockHttp()
      .mount(EntityConflictSummary, mountOptions())
      .request(async (component) => {
        await component.get('.btn-default').trigger('click');
        const modal = component.getComponent(Confirmation);
        await modal.get('.btn-primary').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'PATCH',
        url: '/v1/projects/1/datasets/trees/entities/e?resolve=true&baseVersion=3',
      }]);
  });

  describe('Resolve Conflict', () => {
    const resolve = () =>
      mockHttp()
        .mount(EntityConflictSummary, mountOptions())
        .request(async (component) => {
          await component.get('.btn-default').trigger('click');
          const modal = component.getComponent(Confirmation);
          await modal.get('.btn-primary').trigger('click');
        })
        .respondWithData(() => {
          testData.extendedEntities.resolve(-1);
          return testData.standardEntities.last();
        });

    it('should emit resolve', async () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      const component = await resolve();
      component.emitted().should.have.property('resolve');
    });

    it('should show a success alert', async () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      const component = await resolve();
      component.should.alert('success');
    });

    it('should hide confirmation modal', async () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      const component = await resolve();
      component.getComponent(Confirmation).props().state.should.be.false;
    });

    describe('custom alert messages', () => {
      beforeEach(() => {
        testData.extendedEntities.createPast(1);
        testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      });

      it('shows a message if the conflict has already been resolved', () =>
        mockHttp()
          .mount(EntityConflictSummary, mountOptions())
          .request(async (component) => {
            await component.get('.btn-default').trigger('click');
            await component.get('.confirmation .btn-primary').trigger('click');
          })
          .respondWithProblem(400.32)
          .afterResponse(component => {
            component.should.alert('danger', (message) => {
              message.should.startWith('Another user has already marked the conflict as resolved.');
            });
          }));

      it('shows a message if there has been another update', () =>
        mockHttp()
          .mount(EntityConflictSummary, mountOptions())
          .request(async (component) => {
            await component.get('.btn-default').trigger('click');
            await component.get('.confirmation .btn-primary').trigger('click');
          })
          .respondWithProblem(409.15)
          .afterResponse(component => {
            component.should.alert('danger', (message) => {
              message.should.eql('Data has been modified by another user. Please refresh to see the updated data.');
            });
          }));
    });
  });
});
