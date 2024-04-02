import DatasetNew from '../../../src/components/dataset/new.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { state: true },
  container: {
    requestData: {
      project: testData.extendedProjects.last()
    },
    router: mockRouter('/')
  }
});

describe('DatasetPropertyNew', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedProjects.createPast(1);
  });

  it('toggles the modal', () =>
    load('/projects/1/entity-lists').testModalToggles({
      modal: DatasetNew,
      show: '#dataset-list-new-button',
      hide: '.btn-link'
    }));

  // TODO: Figure out how to focus input with vue3 refs
  it.skip('focuses the input', () => {
    const modal = mount(DatasetNew, mountOptions({ attachTo: document.body }));
    modal.get('input').should.be.focused();
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(DatasetNew, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        request: async (modal) => {
          await modal.get('input').setValue('new_dataset');
          return modal.get('form').trigger('submit');
        },
        disabled: ['.btn-link'],
        modal: true
      }));

  it('sends the correct request', () =>
    mockHttp()
      .mount(DatasetNew, mountOptions())
      .request(async (component) => {
        await component.get('input').setValue('myDataset');
        return component.get('form').trigger('submit');
      })
      .respondWithProblem()
      .testRequests([{ method: 'POST', url: '/v1/projects/1/datasets', data: { name: 'myDataset' } }]));

  describe('after a successful response', () => {
    const submit = (newDataset) =>
      load('/projects/1/entity-lists')
        .complete()
        .request(async (app) => {
          await app.get('#dataset-list-new-button').trigger('click');
          const modal = app.getComponent(DatasetNew);
          await modal.get('input').setValue(newDataset);
          return modal.get('form').trigger('submit');
        })
        .respondWithData(() => testData.extendedDatasets.createPast(1, { name: newDataset }).last());

    it('shows new name on second screen of modal', async () => {
      const app = await submit('MyNewDataset');
      const p = app.findComponent(DatasetNew).find('#entity-list-new-success');
      p.text().should.containEql('MyNewDataset');
    });

    // TODO: it should redirect to page for new entity list
  });
});
