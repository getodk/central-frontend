import ActorPropertiesUpsert from '../../../src/components/actor-properties/upsert.vue';
import PublicLinkEdit from '../../../src/components/public-link/edit.vue';

import testData from '../../data';
import { addActorProperty } from '../../util/trigger';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockHttp, load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  container: {
    requestData: testRequestData(['actorProperties'], {
      form: testData.extendedForms.last(),
      actorProperties: [{ name: 'prop1' }, { name: 'prop2' }]
    })
  }
});
const showModal = async (modal) => modal.setProps({
  state: true,
  publicLink: testData.extendedPublicLinks.last()
});
const mountComponent = async (options = undefined) => {
  const modal = mount(PublicLinkEdit, mountOptions(options));
  await showModal(modal);
  return modal;
};

describe('PublicLinkEdit', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedPublicLinks.createPast(1, {
      displayName: 'My Public Link',
      properties: { prop1: 'value1', prop2: 'value2' }
    });
  });

  it('hides the edit button if there are no actor properties', async () => {
    const app = await load('/projects/1/forms/f/public-links');
    app.find('.public-link-row .edit-button').exists().should.be.false;
  });

  it('shows the display name in the title', async () => {
    const modal = await mountComponent();
    const title = modal.get('.modal-title');
    title.text().should.include('My Public Link');
  });

  it('initializes property values from the field key', async () => {
    const modal = await mountComponent();
    const textareas = modal.findAll('textarea');
    textareas[0].element.value.should.equal('value1');
    textareas[1].element.value.should.equal('value2');
  });

  it('sends the correct request', () => {
    testData.actorProperties.createPast(1, { name: 'prop1' });
    return mockHttp()
      .mount(PublicLinkEdit, mountOptions())
      .request(async (modal) => {
        await showModal(modal);
        const textareas = modal.findAll('textarea');
        await textareas[0].setValue('newValue1');
        return modal.get('.btn-primary').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'PATCH',
        url: '/v1/projects/1/forms/f/public-links/1',
        data: { properties: { prop1: 'newValue1' } }
      }]);
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(PublicLinkEdit, mountOptions())
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

    it('refreshes the list of public links', () =>
      load('/projects/1/forms/f/public-links')
        .complete()
        .request(async (app) => {
          await app.get('.public-link-row .edit-button').trigger('click');
          return app.get('#public-link-edit .btn-primary').trigger('click');
        })
        .respondWithData(() => testData.extendedPublicLinks.last())
        .respondWithData(() => testData.extendedPublicLinks.sorted())
        .testRequests([
          null,
          {
            url: '/v1/projects/1/forms/f/public-links',
            extended: true
          }
        ]));

    it('shows a success message', () =>
      load('/projects/1/forms/f/public-links')
        .complete()
        .request(async (app) => {
          await app.get('.public-link-row .edit-button').trigger('click');
          return app.get('#public-link-edit .btn-primary').trigger('click');
        })
        .respondWithData(() => testData.extendedPublicLinks.last())
        .respondWithData(() => testData.extendedPublicLinks.sorted())
        .afterResponses(app => {
          app.should.alert('success', 'The Public Access Link “My Public Link” was updated successfully.');
        }));

    it('updates the list of actor properties', () =>
      load('/projects/1/forms/f/public-links')
        .complete()
        .request(async (app) => {
          await app.get('.public-link-row .edit-button').trigger('click');
          const modal = app.getComponent(PublicLinkEdit);
          await addActorProperty(modal, 'region', 'north');
          return modal.get('.btn-primary').trigger('click');
        })
        .respondWithSuccess() // Property creation
        .respondWithData(() => testData.extendedPublicLinks.last())
        .respondWithData(() => testData.extendedPublicLinks.sorted())
        .testRequests([
          {
            method: 'POST',
            url: '/v1/projects/1/actor-properties',
            data: { name: 'region' }
          },
          {
            method: 'PATCH',
            url: '/v1/projects/1/forms/f/public-links/1',
            data: {
              properties: { region: 'north' }
            }
          },
          {
            url: '/v1/projects/1/forms/f/public-links',
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
