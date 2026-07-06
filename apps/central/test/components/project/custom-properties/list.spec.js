import CustomPropertyList from '../../../../src/components/project/custom-properties/list.vue';
import CustomPropertiesNew from '../../../../src/components/project/custom-properties/new.vue';

import useProject from '../../../../src/request-data/project';

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';
import { mockRouter } from '../../../util/router';
import { mount } from '../../../util/lifecycle';
import { testRequestData } from '../../../util/request-data';

const mountComponent = () => mount(CustomPropertyList, {
  props: { projectId: '1' },
  container: {
    router: mockRouter('/'),
    requestData: testRequestData([useProject, 'actorProperties'], {
      project: testData.extendedProjects.last(),
      actorProperties: testData.actorProperties.sorted()
    })
  }
});

describe('CustomPropertyList', () => {
  beforeEach(mockLogin);

  it('shows the properties', () => {
    testData.extendedProjects.createPast(1);
    testData.actorProperties.createPast(1, { name: 'region' });
    testData.actorProperties.createPast(1, { name: 'department' });
    const component = mountComponent();
    const rows = component.findAll('tbody tr');
    rows.length.should.equal(2);
    rows[0].find('td').text().should.equal('region');
    rows[1].find('td').text().should.equal('department');
  });

  it('shows empty message when there are no properties', () => {
    testData.extendedProjects.createPast(1);
    const component = mountComponent();
    component.find('.empty-table-message').text().should.equal('No custom properties have been defined for this project.');
  });

  it('shows the new button for a user with project.update permission', () => {
    testData.extendedProjects.createPast(1);
    const component = mountComponent();
    component.find('#custom-properties-list-new-button').exists().should.be.true;
  });

  it('toggles the new property modal', () => {
    testData.extendedProjects.createPast(1);
    return load('/projects/1/custom-properties').testModalToggles({
      modal: CustomPropertiesNew,
      show: '#custom-properties-list-new-button',
      hide: '.btn-link'
    });
  });

  it('shows success alert after successful creation', async () => {
    testData.extendedProjects.createPast(1);
    const app = await load('/projects/1/custom-properties')
      .complete()
      .request(async (c) => {
        await c.get('#custom-properties-list-new-button').trigger('click');
        await c.get('#custom-properties-new input').setValue('region');
        return c.get('#custom-properties-new form').trigger('submit');
      })
      .respondWithSuccess();
    app.should.alert('success', 'Custom property created successfully.');
  });

  it('sends the correct POST request when creating a property', () => {
    testData.extendedProjects.createPast(1);
    return load('/projects/1/custom-properties')
      .complete()
      .request(async (app) => {
        await app.get('#custom-properties-list-new-button').trigger('click');
        await app.get('#custom-properties-new input').setValue('region');
        return app.get('#custom-properties-new form').trigger('submit');
      })
      .respondWithSuccess()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects/1/actor-properties',
        data: { name: 'region' }
      }]);
  });
});
