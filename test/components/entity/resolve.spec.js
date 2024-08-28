import { last } from 'ramda';

import EntityResolve from '../../../src/components/entity/resolve.vue';

import testData from '../../data';
import { mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';

const relevantToConflict = () => testData.extendedEntityVersions.sorted()
  .filter(version => version.relevantToConflict);
const showModal = (respond = true) => {
  const dataset = testData.extendedDatasets.last();
  return mockHttp()
    .mount(EntityResolve, {
      global: {
        provide: { projectId: '1', datasetName: dataset.name }
      },
      container: {
        requestData: { project: testData.extendedProjects.last(), dataset },
        router: mockRouter(`/projects/1/entity-lists/${encodeURIComponent(dataset.name)}/entities`)
      }
    })
    .request(modal => modal.setProps({
      state: true,
      entity: last(testData.entityOData().value)
    }))
    .modify(series =>
      (respond ? series.respondWithData(relevantToConflict) : series));
};

describe('EntityResolve', () => {
  it('shows the entity label in the title', async () => {
    testData.extendedEntities.createPast(1, { label: 'My Entity' });
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    const modal = await showModal();
    const text = modal.get('.modal-title').text();
    text.should.equal('Parallel updates to “My Entity”');
  });

  describe('conflict summary table', () => {
    it('sends the correct request', () => {
      testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      return showModal().testRequests([{
        url: '/v1/projects/1/datasets/%C3%A1/entities/e/versions?relevantToConflict=true',
        extended: true
      }]);
    });

    it('shows an alert if no conflicts are returned', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      return showModal(false)
        .respondWithData(() => [])
        .afterResponse(modal => {
          modal.should.alert('danger', (message) => {
            message.should.startWith('Another user has already marked the conflict as resolved.');
          });
        });
    });
  });

  it('redirects to Entity details page', async () => {
    testData.extendedEntities.createPast(1, { uuid: 'the_id', label: 'My Entity' });
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    const modal = await showModal();
    const moreDetailsBtn = modal.getComponent('.more-details');
    moreDetailsBtn.props().to.should.eql('/projects/1/entity-lists/trees/entities/the_id');
  });

  describe('"Mark as resolved" button', () => {
    const resolve = (series) => series
      .request(modal => modal.get('.mark-as-resolved').trigger('click'))
      .respondWithData(() => {
        testData.extendedEntities.resolve(-1);
        return testData.standardEntities.last();
      });

    it('sends correct request on markAsResolved', () => {
      testData.extendedDatasets.createPast(1, { name: 'people' });
      testData.extendedEntities.createPast(1, { uuid: 'the_id', label: 'My Entity' });
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      return showModal()
        .complete()
        .modify(resolve)
        .testRequests([{
          method: 'PATCH',
          url: '/v1/projects/1/datasets/people/entities/the_id?resolve=true&baseVersion=3',
        }]);
    });

    it('implements some standard button things', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      return showModal()
        .complete()
        .testStandardButton({
          button: '.mark-as-resolved',
          disabled: ['.more-details', '.edit-entity', '.modal-actions .btn-primary'],
          modal: true
        });
    });

    describe('custom alert messages', () => {
      beforeEach(() => {
        testData.extendedEntities.createPast(1);
        testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      });

      it('shows a message if the conflict has already been resolved', () =>
        showModal()
          .complete()
          .request(modal => modal.get('.mark-as-resolved').trigger('click'))
          .respondWithProblem(400.32)
          .afterResponse(component => {
            component.should.alert('danger', (message) => {
              message.should.startWith('Another user has already marked the conflict as resolved.');
            });
          }));

      it('shows a message if there has been another update', () =>
        showModal()
          .complete()
          .request(modal => modal.get('.mark-as-resolved').trigger('click'))
          .respondWithProblem(409.15)
          .afterResponse(component => {
            component.should.alert('danger', (message) => {
              message.should.eql('Data has been modified by another user. Please refresh to see the updated data.');
            });
          }));
    });

    it('shows a success message', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      return showModal()
        .complete()
        .modify(resolve)
        .afterResponse(modal => {
          modal.get('.success-msg').text().should.eql('The conflict warning has been cleared from the Entity.');
        });
    });

    it('hides the success message after the modal is hidden', () => {
      testData.extendedEntities
        .createPast(1, { uuid: 'e1' })
        .createPast(1, { uuid: 'e2' });
      testData.extendedEntityVersions
        .createPast(2, { uuid: 'e1', baseVersion: 1 })
        .createPast(2, { uuid: 'e2', baseVersion: 1 });
      return showModal()
        .complete()
        .modify(resolve)
        .complete()
        .request(async (modal) => {
          await modal.setProps({ state: false, entity: null });
          await modal.setProps({
            state: true,
            entity: testData.entityOData().value[0]
          });
        })
        .respondWithData(relevantToConflict)
        .afterResponse(modal => {
          modal.find('.success-msg').exists().should.be.false;
        });
    });
  });

  describe('project viewer', () => {
    beforeEach(() => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', datasets: 1 });
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    });

    it('does not show the second paragraph', async () => {
      const modal = await showModal();
      modal.findAll('p').length.should.equal(1);
    });

    it('does not show the update or resolve buttons', async () => {
      const modal = await showModal();
      const btns = modal.findAll('#entity-resolve-table-toggle ~ .btn');
      btns.length.should.equal(1);
      btns[0].classes('more-details').should.be.true;
    });
  });
});
