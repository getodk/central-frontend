import DatasetPropertyNew from '../../../../src/components/dataset/overview/new-property.vue';
import DatasetProperties from '../../../../src/components/dataset/overview/dataset-properties.vue';
import ConnectionToForms from '../../../../src/components/dataset/overview/connection-to-forms.vue';

import testData from '../../../data';
import { load, mockHttp } from '../../../util/http';
import { mergeMountOptions, mount } from '../../../util/lifecycle';
import { mockLogin } from '../../../util/session';
import { mockRouter } from '../../../util/router';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { state: true },
  container: {
    requestData: {
      project: testData.extendedProjects.last(),
      dataset: testData.extendedDatasets.last(),
    },
    router: mockRouter('/')
  }
});

const addProperty = async (component, propertyName = 'width') => {
  await component.get('input').setValue(propertyName);
  return component.get('form').trigger('submit');
};

describe('DatasetPropertyNew', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [
        {
          name: 'height',
          forms: [
            { name: 'Tree Registration', xmlFormId: 'tree_registration' },
          ]
        }
      ],
      sourceForms: [
        { name: 'Tree Registration', xmlFormId: 'tree_registration' },
      ]
    });
  });

  it('toggles the modal', () =>
    load('/projects/1/entity-lists/trees').testModalToggles({
      modal: DatasetPropertyNew,
      show: '#dataset-property-new-button',
      hide: '.btn-link'
    }));

  it('focuses the input', () => {
    const modal = mount(DatasetPropertyNew, mountOptions({ attachTo: document.body }));
    modal.get('input').should.be.focused();
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(DatasetPropertyNew, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        request: async (modal) => {
          await modal.get('input').setValue('my_new_property');
          return modal.get('form').trigger('submit');
        },
        disabled: ['.btn-link'],
        modal: true
      }));

  it('sends the correct request', () =>
    mockHttp()
      .mount(DatasetPropertyNew, mountOptions())
      .request(async (app) => addProperty(app, 'width_cm'))
      .respondWithProblem()
      .testRequests([{ method: 'POST', url: '/v1/projects/1/datasets/trees/properties', data: { name: 'width_cm' } }]));

  describe('after a successful response', () => {
    const submit = (newPropertyName) =>
      load('/projects/1/entity-lists/trees')
        .complete()
        .request(async (app) => {
          await app.get('#dataset-property-new-button').trigger('click');
          return addProperty(app, newPropertyName);
        })
        .respondWithData(() => ({ success: true }))
        .respondWithData(() => testData.extendedDatasets.addProperty(-1, newPropertyName));

    it('shows new property in property list', async () => {
      const app = await submit('width_cm');
      const propertyList = app.findComponent(DatasetProperties).findAll('tbody tr');
      propertyList.length.should.equal(2);
      propertyList.map(row => row.find('td').text()).should.eql(['height', 'width_cm']);
    });

    it('shows (none) in updated by column for new property', async () => {
      const app = await submit('width_cm');
      const propertyList = app.findComponent(DatasetProperties).findAll('tbody tr');
      propertyList[1].findAll('td')[1].text().should.equal('(None)');
    });

    it('updates property count in form summary', async () => {
      const app = await submit('width_cm');
      const connections = app.findComponent(ConnectionToForms);
      connections.find('.caption-cell').text().should.equal('1 of 2 properties');
    });
  });

  it('shows a custom message for a duplicate property name', () =>
    mockHttp()
      .mount(DatasetPropertyNew, mountOptions())
      .request(async (modal) => {
        await modal.get('input').setValue('my_new_property');
        return modal.get('form').trigger('submit');
      })
      .respondWithProblem({
        code: 409.3,
        message: 'A resource already exists with name,datasetId value(s) of my_new_property,1.',
        details: {
          fields: ['name', 'datasetId'],
          values: ['my_new_property', 1]
        }
      })
      .afterResponse(modal => {
        modal.should.alert('danger', (message) => {
          message.should.startWith('A property already exists in this Entity List with the name of “my_new_property”.');
        });
      }));
});
