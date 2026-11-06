import ActorPropertiesUpsert from '../../../src/components/actor-properties/upsert.vue';
import FieldKeyEdit from '../../../src/components/field-key/edit.vue';

import testData from '../../data';
import { addActorProperty } from '../../util/trigger';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockHttp, load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  container: {
    requestData: testRequestData(['actorProperties'], {
      project: testData.extendedProjects.last(),
      actorProperties: [{ name: 'prop1' }, { name: 'prop2' }]
    })
  }
});
const showModal = async (modal) =>
  modal.setProps({ state: true, fieldKey: testData.extendedFieldKeys.last() });
const mountComponent = async (options = undefined) => {
  const modal = mount(FieldKeyEdit, mountOptions(options));
  await showModal(modal);
  return modal;
};

describe('FieldKeyEdit', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedFieldKeys.createPast(1, {
      displayName: 'My App User',
      properties: { prop1: 'value1', prop2: 'value2' }
    });
  });

  it('hides the edit button if there are no actor properties', async () => {
    const app = await load('/projects/1/app-users');
    app.find('.field-key-row .edit-button').exists().should.be.false;
  });

  it('shows the display name', async () => {
    const modal = await mountComponent();
    const title = modal.get('.modal-title');
    title.text().should.include('My App User');
  });

  it('initializes property values from the field key', async () => {
    const modal = await mountComponent();
    const textareas = modal.findAll('textarea');
    textareas[0].element.value.should.equal('value1');
    textareas[1].element.value.should.equal('value2');
  });

  it('sends the correct request', () =>
    mockHttp()
      .mount(FieldKeyEdit, mountOptions())
      .request(async (modal) => {
        await showModal(modal);
        const textareas = modal.findAll('textarea');
        await textareas[0].setValue('newValue1');
        await textareas[1].setValue('');
        return modal.get('.btn-primary').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'PATCH',
        url: '/v1/projects/1/app-users/1',
        data: { properties: { prop1: 'newValue1', prop2: '' } }
      }]));

  it('implements some standard button things', () =>
    mockHttp()
      .mount(FieldKeyEdit, mountOptions())
      .afterResponses(showModal)
      .testStandardButton({
        button: '.btn-primary',
        disabled: [ActorPropertiesUpsert, '.btn-link'],
        modal: true
      }));

  describe('after a successful response', () => {
    beforeEach(() => {
      testData.actorProperties.createPast(1, { name: 'prop1' });
    });

    it('refreshes the list of app users', () =>
      load('/projects/1/app-users')
        .complete()
        .request(async (app) => {
          await app.get('.field-key-row .edit-button').trigger('click');
          return app.get('#field-key-edit .btn-primary').trigger('click');
        })
        .respondWithData(() => testData.standardFieldKeys.last())
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .testRequests([
          null,
          {
            url: '/v1/projects/1/app-users',
            extended: true
          }
        ]));

    it('shows a success message', () =>
      load('/projects/1/app-users')
        .complete()
        .request(async (app) => {
          await app.get('.field-key-row .edit-button').trigger('click');
          return app.get('#field-key-edit .btn-primary').trigger('click');
        })
        .respondWithData(() => testData.standardFieldKeys.last())
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .afterResponses(app => {
          app.should.alert('success', 'The App User “My App User” was updated successfully.');
        }));

    it('updates the list of actor properties', () =>
      load('/projects/1/app-users')
        .complete()
        .request(async (app) => {
          await app.get('.field-key-row .edit-button').trigger('click');
          const modal = app.getComponent(FieldKeyEdit);
          await addActorProperty(modal, 'region', 'north');
          return modal.get('.btn-primary').trigger('click');
        })
        .respondWithSuccess() // Property creation
        .respondWithData(() => testData.standardFieldKeys.last())
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .testRequests([
          {
            method: 'POST',
            url: '/v1/projects/1/actor-properties',
            data: { name: 'region' }
          },
          {
            method: 'PATCH',
            url: '/v1/projects/1/app-users/1',
            data: {
              properties: { region: 'north' }
            }
          },
          {
            url: '/v1/projects/1/app-users',
            extended: true
          }
        ])
        .afterResponses(app => {
          const text = app.findAll('.table-freeze-scrolling th')
            .map(th => th.text());
          text.should.eql(['prop1', 'region']);
        }));
  });
});
