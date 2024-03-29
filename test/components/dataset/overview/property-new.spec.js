import DatasetPropertyNew from '../../../../src/components/dataset/overview/new-property.vue';
import DatasetProperties from '../../../../src/components/dataset/overview/dataset-properties.vue';

import testData from '../../../data';
import { load, mockHttp } from '../../../util/http';
import { mergeMountOptions, mount } from '../../../util/lifecycle';
import { mockLogin } from '../../../util/session';
import { mockRouter } from '../../../util/router';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { state: true, managed: true },
  container: {
    requestData: {
      project: testData.extendedProjects.last(),
      dataset: testData.extendedDatasets.last()
    },
    router: mockRouter('/')
  }
});

const addProperty = async (component, propertyName = 'width') => {
  await component.get('input').setValue(propertyName);
  return component.get('form').trigger('submit');
};

describe('DatasetPropertyNew', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    return load('/projects/1/entity-lists/trees').testModalToggles({
      modal: DatasetPropertyNew,
      show: '#dataset-list-new-button',
      hide: '.btn-link'
    });
  });

  // TODO: Figure out how to focus input with vue3 refs
  it.skip('focuses the input', () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    const modal = mount(DatasetPropertyNew, mountOptions({ attachTo: document.body }));
    modal.get('input').should.be.focused();
  });

  it('implements some standard button things', () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    return mockHttp()
      .mount(DatasetPropertyNew, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        request: async (modal) => {
          await modal.get('input').setValue('my_new_property');
          return modal.get('form').trigger('submit');
        },
        disabled: ['.btn-link'],
        modal: true
      });
  });

  describe('after a successful response', () => {
    it('shows new property', () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' }).last();
      return load('/projects/1/entity-lists/trees')
        .complete()
        .request(async (app) => {
          await app.get('#dataset-list-new-button').trigger('click');
          return addProperty(app, 'width_cm');
        })
        .respondWithData(() => ({ success: true }))
        .respondWithData(() => testData.extendedDatasets.addProperty(-1, 'width_cm'))
        .then(app => {
          const propertyList = app.findComponent(DatasetProperties);
          propertyList.findAll('tbody tr').length.should.equal(1);
          propertyList.find('tbody tr td').text().should.equal('width_cm');
        });
    });
  });
});
