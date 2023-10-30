import EntityResolve from '../../../src/components/entity/resolve.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockHttp } from '../../util/http';
import { mockRouter } from '../../util/router';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { state: true, entity: testData.entityOData().value[0] },
  container: {
    router: mockRouter('/'),
    requestData: { dataset: testData.extendedDatasets.last() }
  }
});
const mountComponent = (options = undefined) =>
  mount(EntityResolve, mountOptions(options));

describe('EntityResolve', () => {
  it('shows the entity label in the title', () => {
    testData.extendedEntities.createPast(1, { label: 'My Entity' });
    const text = mountComponent().get('.modal-title').text();
    text.should.equal('Parallel updates to “My Entity”');
  });

  it('redirects to Entity details page', () => {
    testData.extendedEntities.createPast(1, { uuid: 'the_id', label: 'My Entity' });
    const moreDetailsBtn = mountComponent().getComponent('.more-details');
    moreDetailsBtn.props().to.should.eql('/projects/1/entity-lists/trees/entities/the_id');
  });

  it('sends correct request on markAsResolved', () => {
    testData.extendedDatasets.createPast(1, { name: 'people' });
    testData.extendedEntities.createPast(1, { uuid: 'the_id', label: 'My Entity' });
    return mockHttp()
      .mount(EntityResolve, mountOptions())
      .request(modal => modal.get('.mark-as-resolved').trigger('click'))
      .respondWithData(() => {
        testData.extendedEntities.resolve(-1);
        return testData.standardEntities.last();
      })
      .testRequests([{
        method: 'PATCH',
        url: '/v1/projects/1/datasets/people/entities/the_id?resolve=true',
        headers: {
          'If-Match': '"1"'
        }
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
    return mockHttp()
      .mount(EntityResolve, mountOptions())
      .testStandardButton({
        button: '.mark-as-resolved',
        disabled: ['.more-details', '.edit-entity', '.modal-actions .btn-primary'],
        modal: true
      });
  });

  it('shows conflict error', () => {
    testData.extendedEntities.createPast(1, { label: 'My Entity' });
    return mockHttp()
      .mount(EntityResolve, mountOptions())
      .request(modal => modal.get('.mark-as-resolved').trigger('click'))
      .respondWithProblem(409.15)
      .afterResponse(component => {
        component.should.alert('danger', (message) => {
          message.should.eql('Data has been modified by another user. Please refresh to see the updated data.');
        });
      });
  });
});
