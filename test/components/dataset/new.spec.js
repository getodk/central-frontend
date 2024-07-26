import DatasetNew from '../../../src/components/dataset/new.vue';

import testData from '../../data';
import { findTab } from '../../util/dom';
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

describe('DatasetNew', () => {
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

  it('focuses the input', () => {
    const modal = mount(DatasetNew, mountOptions({ attachTo: document.body }));
    modal.get('input').should.be.focused();
  });

  it('does not shows message about entity manipulation if project is not encrypted', () => {
    const modal = mount(DatasetNew, mountOptions({ attachTo: document.body }));
    modal.find('.icon-exclamation-triangle').exists().should.be.false;
  });

  it('shows message about entity manipulation in encrypted project', () => {
    const key = testData.standardKeys.createPast(1, { managed: true }).last();
    testData.extendedProjects.createPast(1, { key });
    const modal = mount(DatasetNew, mountOptions({ attachTo: document.body }));
    modal.find('.icon-exclamation-triangle').exists().should.be.true;
    modal.get('.modal-introduction').text().should.include('This Project is encrypted');
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
      const p = app.findComponent(DatasetNew).find('#dataset-new-success');
      p.text().should.include('MyNewDataset');
    });

    it('redirects to new entity list page after clicking done', () =>
      submit('MyNewDataset')
        .complete()
        .request((app) => app.get('#dataset-new-done-button').trigger('click'))
        .respondWithData(() => testData.extendedDatasets.last())
        .complete()
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/entity-lists/MyNewDataset');
        }));

    it('increments the count of entity lists', () =>
      submit('MyNewDataset')
        .complete()
        .request(app => app.get('#dataset-new-done-button').trigger('click'))
        .respondWithData(() => testData.extendedDatasets.last())
        .complete()
        .load('/projects/1', { project: false })
        .afterResponses(app => {
          findTab(app, 'Entities').get('.badge').text().should.equal('1');
        }));
  });

  it('shows a custom message for a duplicate dataset name', () =>
    mockHttp()
      .mount(DatasetNew, mountOptions())
      .request(async (component) => {
        await component.get('input').setValue('myDataset');
        return component.get('form').trigger('submit');
      })
      .respondWithProblem({
        code: 409.3,
        message: 'A resource already exists with name,projectId value(s) of myDataset,1.',
        details: {
          fields: ['name', 'projectId'],
          values: ['myDataset', 1]
        }
      })
      .afterResponse(modal => {
        modal.should.alert('danger', (message) => {
          message.should.startWith('An Entity List already exists in this Project with the name of “myDataset”.');
        });
      }));
});
