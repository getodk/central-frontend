import Confirmation from '../../../../src/components/confirmation.vue';
import DatasetProperties from '../../../../src/components/dataset/overview/dataset-properties.vue';
import DeletePropertyError from '../../../../src/components/dataset/overview/delete-property-error.vue';
import FormLink from '../../../../src/components/form/link.vue';

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';
import { mockRouter } from '../../../util/router';
import { mount } from '../../../util/lifecycle';

const mountComponent = () => mount(DatasetProperties, {
  container: {
    router: mockRouter('/'),
    requestData: {
      project: testData.extendedProjects.last(),
      dataset: testData.extendedDatasets.last()
    }
  }
});

describe('DatasetProperties', () => {
  beforeEach(mockLogin);

  it('shows the properties with their forms', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [
        {
          name: 'height',
          forms: [
            { name: 'Tree Registration', xmlFormId: 'tree_registration' },
            { name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }
          ]
        },
        {
          name: 'circumference',
          forms: [
            { name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }
          ]
        },
        {
          name: 'type',
          forms: [
            { name: 'Tree Registration', xmlFormId: 'tree_registration' },
            { name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }
          ]
        }
      ]
    });
    const component = mountComponent();
    const rows = component.findAll('tbody tr');

    rows.length.should.be.eql(5);

    rows[0].findAll('td')[0].text().should.be.eql('height');
    rows[0].findAll('td')[2].text().should.be.eql('Tree Registration');
    rows[0].getComponent(FormLink).props().to.should.be.equal('/projects/1/forms/tree_registration/submissions');

    rows[1].findAll('td')[0].text().should.be.eql('Tree Registration Adv');
    rows[1].getComponent(FormLink).props().to.should.be.equal('/projects/1/forms/tree_registration_adv/submissions');

    rows[2].findAll('td')[0].text().should.be.eql('circumference');
    rows[2].findAll('td')[2].text().should.be.eql('Tree Registration Adv');
    rows[2].getComponent(FormLink).props().to.should.be.equal('/projects/1/forms/tree_registration_adv/submissions');

    rows[3].findAll('td')[0].text().should.be.eql('type');
    rows[3].findAll('td')[2].text().should.be.eql('Tree Registration');
    rows[3].getComponent(FormLink).props().to.should.be.equal('/projects/1/forms/tree_registration/submissions');

    rows[4].findAll('td')[0].text().should.be.eql('Tree Registration Adv');
    rows[4].getComponent(FormLink).props().to.should.be.equal('/projects/1/forms/tree_registration_adv/submissions');
  });

  it('shows the property even if there is no associated form', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [
        { name: 'height', forms: [] }
      ]
    });
    const component = mountComponent();
    const rows = component.findAll('tbody tr');

    rows.length.should.be.eql(1);
    rows[0].findAll('td')[0].text().should.be.eql('height');
    rows[0].findAll('td')[2].text().should.be.eql('(None)');
  });

  it('shows empty message when there is no properties', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedDatasets.createPast(1, {
      name: 'trees', properties: []
    });
    const component = mountComponent();
    component.find('.empty-table-message').text().should.be.eql('The Entities in this Entity List do not have any user-defined properties.');
  });

  describe('delete property', () => {
    it('shows a delete button for each property', () => {
      testData.extendedProjects.createPast(1);
      testData.extendedDatasets.createPast(1, {
        name: 'trees',
        properties: [
          { name: 'height', forms: [] },
          { name: 'species', forms: [] }
        ]
      });
      const component = mountComponent();
      component.find('.delete-button').exists().should.be.true;
      component.findAll('.delete-button').length.should.be.eql(2);
    });

    it('shows confirmation modal for the correct property when delete button is clicked', async () => {
      testData.extendedProjects.createPast(1);
      testData.extendedDatasets.createPast(1, {
        name: 'trees',
        properties: [
          { name: 'height', forms: [] },
          { name: 'species', forms: [] },
        ]
      });
      const component = mountComponent();
      await component.findAll('.delete-button')[1].trigger('click');
      component.getComponent(Confirmation).props().state.should.be.true;
      component.getComponent(Confirmation).text().should.match(/Are you sure you want to delete the Property “species”/);
    });

    it('sends the correct DELETE request', () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees',
        properties: [
          { name: 'height', forms: [] },
          { name: 'species', forms: [] },
        ]
      });
      return load('/projects/1/entity-lists/trees/properties')
        .complete()
        .request(async (app) => {
          await app.findAll('.delete-button')[1].trigger('click');
          app.get('.confirmation').text().should.match(/species/);
          return app.get('.confirmation .btn-primary').trigger('click');
        })
        .respondWithSuccess()
        .testRequests([{
          method: 'DELETE',
          url: '/v1/projects/1/datasets/trees/properties/species'
        }]);
    });

    it('shows success alert after successful deletion', async () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees',
        properties: [{ name: 'height', forms: [] }]
      });
      const app = await load('/projects/1/entity-lists/trees/properties')
        .complete()
        .request(async (c) => {
          await c.get('.delete-button').trigger('click');
          return c.get('.confirmation .btn-primary').trigger('click');
        })
        .respondWithSuccess();
      app.should.alert('success', 'Property “height” has been deleted.');
    });

    it('removes property from list after successful deletion', async () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees',
        properties: [
          { name: 'height', forms: [] },
          { name: 'circumference', forms: [] }
        ]
      });
      const app = await load('/projects/1/entity-lists/trees/properties')
        .complete()
        .request(async (c) => {
          await c.get('.delete-button').trigger('click');
          return c.get('.confirmation .btn-primary').trigger('click');
        })
        .respondWithSuccess();
      const rows = app.findAll('tbody tr');
      rows.length.should.equal(1);
      rows[0].findAll('td')[0].text().should.equal('circumference');
    });

    it('shows error modal when deletion fails with 409.22', async () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees',
        properties: [{ name: 'height', forms: [] }]
      });
      const app = await load('/projects/1/entity-lists/trees/properties')
        .complete()
        .request(async (c) => {
          await c.get('.delete-button').trigger('click');
          return c.get('.confirmation .btn-primary').trigger('click');
        })
        .respondWithProblem({
          code: 409.22,
          message: 'Cannot delete property',
          details: {
            propertyName: 'height',
            prerequisites: {
              nonEmptyEntities: null,
              dependentForms: null
            }
          }
        });
      app.getComponent(DeletePropertyError).props().state.should.be.true;
    });
  });
});
