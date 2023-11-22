import EntityResolve from '../../../src/components/entity/resolve.vue';

import useEntityVersions from '../../../src/request-data/entity-versions';

import testData from '../../data';
import { mergeMountOptions } from '../../util/lifecycle';
import { mockHttp } from '../../util/http';
import { mockRouter } from '../../util/router';
import { testRequestData } from '../../util/request-data';

const showModal = (options = undefined) => {
  const dataset = testData.extendedDatasets.last();
  return mockHttp()
    .mount(EntityResolve, mergeMountOptions(options, {
      props: { state: false },
      global: {
        provide: { projectId: '1', datasetName: dataset.name }
      },
      container: {
        router: mockRouter(`/projects/1/entity-lists/${encodeURIComponent(dataset.name)}/entities`),
        requestData: testRequestData([useEntityVersions], { dataset })
      }
    }))
    .complete()
    .request(modal =>
      modal.setProps({ state: true, entity: testData.entityOData().value[0] }))
    .respondWithData(() => testData.extendedEntityVersions.sorted()
      .filter(version => version.relevantToConflict));
};

describe('EntityResolve', () => {
  it('shows the entity label in the title', async () => {
    testData.extendedEntities.createPast(1, { label: 'My Entity' });
    const modal = await showModal();
    const text = modal.get('.modal-title').text();
    text.should.equal('Parallel updates to “My Entity”');
  });

  describe('conflict summary table', () => {
    it('sends the correct request', () => {
      testData.extendedDatasets.createPast(1, { name: 'á' });
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      return showModal().testRequests([{
        url: '/projects/1/datasets/%C3%A1/entities/e/versions?relevantToConflict=true',
        extended: true
      }]);
    });
  });

  it('redirects to Entity details page', async () => {
    testData.extendedEntities.createPast(1, { uuid: 'the_id', label: 'My Entity' });
    const modal = await showModal();
    const moreDetailsBtn = modal.getComponent('.more-details');
    moreDetailsBtn.props().to.should.eql('/projects/1/entity-lists/trees/entities/the_id');
  });

  describe('"Mark as resolved" button', () => {
    it('sends correct request on markAsResolved', () => {
      testData.extendedDatasets.createPast(1, { name: 'people' });
      testData.extendedEntities.createPast(1, { uuid: 'the_id', label: 'My Entity' });
      return showModal()
        .complete()
        .request(modal => modal.get('.mark-as-resolved').trigger('click'))
        .respondWithData(() => {
          testData.extendedEntities.resolve(-1);
          return testData.standardEntities.last();
        })
        .testRequests([{
          method: 'PATCH',
          url: '/v1/projects/1/datasets/people/entities/the_id?resolve=true&baseVersion=1',
        }])
        .afterResponse(async modal => {
          modal.get('.success-msg').text().should.eql('The conflict warning has been cleared from the Entity.');

          await modal.setProps({ state: false });
          await modal.setProps({ state: true });

          modal.find('.success-msg').exists().should.be.false();
        });
    });

    it('implements some standard button things', () => {
      testData.extendedEntities.createPast(1);
      return showModal()
        .complete()
        .testStandardButton({
          button: '.mark-as-resolved',
          disabled: ['.more-details', '.edit-entity', '.modal-actions .btn-primary'],
          modal: true
        });
    });

    it('shows conflict error', () => {
      testData.extendedEntities.createPast(1, { label: 'My Entity' });
      return showModal()
        .complete()
        .request(modal => modal.get('.mark-as-resolved').trigger('click'))
        .respondWithProblem(409.15)
        .afterResponse(component => {
          component.should.alert('danger', (message) => {
            message.should.eql('Data has been modified by another user. Please refresh to see the updated data.');
          });
        });
    });
  });
});
