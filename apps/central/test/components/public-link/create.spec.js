import { nextTick } from 'vue';

import PublicLinkCreate from '../../../src/components/public-link/create.vue';

import testData from '../../data';
import { addActorProperty } from '../../util/trigger';
import { load, mockHttp } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { state: true },
  container: {
    requestData: testRequestData(['actorProperties'], {
      project: testData.extendedProjects.last(),
      form: testData.extendedForms.last(),
      actorProperties: testData.actorProperties.sorted()
    })
  }
});

describe('PublicLinkCreate', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedForms.createPast(1);
  });

  it('toggles the modal', () =>
    load('/projects/1/forms/f/public-links').testModalToggles({
      modal: PublicLinkCreate,
      show: '.heading-with-button .btn-primary',
      hide: '.btn-link'
    }));

  it('focuses the display name input', async () => {
    const modal = mount(PublicLinkCreate, mountOptions({
      attachTo: document.body
    }));
    await nextTick();
    modal.get('input').should.be.focused();
  });

  it('resets the form after the modal is hidden', async () => {
    const modal = mount(PublicLinkCreate, mountOptions());
    await modal.get('input').setValue('My Public Link');
    await modal.get('input[type="checkbox"]').setValue(true);
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    modal.get('input').element.value.should.equal('');
    modal.get('input[type="checkbox"]').element.checked.should.be.false;
  });

  it('resets property values after the modal is hidden', async () => {
    testData.actorProperties.createPast(1, { name: 'prop1' });
    const modal = mount(PublicLinkCreate, mountOptions());
    await modal.get('textarea').setValue('some value');
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    modal.get('textarea').element.value.should.equal('');
  });

  describe('request', () => {
    it('sends the correct request', () =>
      mockHttp()
        .mount(PublicLinkCreate, mountOptions())
        .request(async (modal) => {
          await modal.get('input').setValue('My Public Link');
          return modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { method, url, data }) => {
          method.should.equal('POST');
          url.should.equal('/v1/projects/1/forms/f/public-links');
          data.should.eql({ displayName: 'My Public Link', once: false });
        })
        .respondWithProblem());

    it('sends the correct request with custom properties', () => {
      testData.actorProperties.createPast(1, { name: 'prop1' });
      return mockHttp()
        .mount(PublicLinkCreate, mountOptions())
        .request(async (modal) => {
          await modal.get('input').setValue('My Public Link');
          await modal.get('textarea').setValue('value1');
          return modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { method, url, data }) => {
          method.should.equal('POST');
          url.should.equal('/v1/projects/1/forms/f/public-links');
          data.should.eql({ displayName: 'My Public Link', once: false, properties: { prop1: 'value1' } });
        })
        .respondWithProblem();
    });

    it('does not send properties when no property values are filled in', () =>
      mockHttp()
        .mount(PublicLinkCreate, mountOptions())
        .request(async (modal) => {
          await modal.get('input').setValue('My Public Link');
          return modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { data }) => {
          data.should.not.have.property('properties');
        })
        .respondWithProblem());

    it('sends the correct once property if the checkbox is checked', () =>
      mockHttp()
        .mount(PublicLinkCreate, mountOptions())
        .request(async (modal) => {
          await modal.get('input').setValue('My Public Link');
          await modal.get('input[type="checkbox"]').setValue(true);
          return modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { data }) => {
          data.once.should.be.true;
        })
        .respondWithProblem());
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(PublicLinkCreate, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        request: async (modal) => {
          await modal.get('input').setValue('My Public Link');
          return modal.get('form').trigger('submit');
        },
        disabled: ['fieldset', '.btn-link'],
        modal: true
      }));

  describe('adding a property inline', () => {
    it('sends the correct requests', () =>
      mockHttp()
        .mount(PublicLinkCreate, mountOptions())
        .request(async (modal) => {
          await modal.get('input').setValue('My Public Link');
          await addActorProperty(modal, 'region', 'north');
          return modal.get('form').trigger('submit');
        })
        .respondWithSuccess()
        .respondWithProblem()
        .testRequests([
          {
            method: 'POST',
            url: '/v1/projects/1/actor-properties',
            data: { name: 'region' }
          },
          {
            method: 'POST',
            url: '/v1/projects/1/forms/f/public-links',
            data: { displayName: 'My Public Link', once: false, properties: { region: 'north' } }
          }
        ]));
  });

  describe('after a successful response', () => {
    const submit = () => {
      testData.extendedPublicLinks.createPast(1);
      return load('/projects/1/forms/f/public-links')
        .complete()
        .request(async (app) => {
          await app.get('.heading-with-button .btn-primary').trigger('click');
          const modal = app.getComponent(PublicLinkCreate);
          await modal.get('input').setValue('My Public Link');
          return modal.get('form').trigger('submit');
        })
        .respondWithData(() => testData.extendedPublicLinks.createNew({
          displayName: 'My Public Link'
        }))
        .respondWithData(() => testData.extendedPublicLinks.sorted());
    };

    it('hides the modal', async () => {
      const app = await submit();
      app.getComponent(PublicLinkCreate).props().state.should.be.false;
    });

    it('shows a success alert', async () => {
      const app = await submit();
      app.should.alert('success');
    });

    it('updates the number of rows', async () => {
      const app = await submit();
      app.findAll('.public-link-row').length.should.equal(2);
    });

    it('highlights the new public link', async () => {
      const app = await submit();
      app.get('.public-link-row').classes('success').should.be.true;
    });

    it('updates the count in the tab', async () => {
      const app = await submit();
      app.get('#page-head-tabs li.active .badge').text().should.equal('2');
    });
  });

  describe('list of actor properties', () => {
    const create = () => load('/projects/1/forms/f/public-links')
      .afterResponses(app => {
        app.find('.table-freeze-scrolling').exists().should.be.false;
      })
      .request(async (app) => {
        await app.get('.heading-with-button .btn-primary').trigger('click');
        const modal = app.getComponent(PublicLinkCreate);
        await modal.get('input').setValue('My Public Link');
        await addActorProperty(modal, 'region', 'north');
        return modal.get('form').trigger('submit');
      })
      // Property creation
      .respondWithSuccess();

    it('updates the list after the public link is created', () =>
      create()
        .respondWithData(() => testData.extendedPublicLinks.createNew({
          displayName: 'My Public Link',
          properties: { region: 'north' }
        }))
        .respondWithData(() => testData.extendedPublicLinks.sorted())
        .afterResponses(app => {
          app.get('.table-freeze-scrolling th').text().should.equal('region');
        }));

    it('updates the list if only the property request succeeds', () =>
      create()
        .respondWithProblem() // Public link creation
        .afterResponses(async (app) => {
          // The table behind the modal should not change until the modal is
          // hidden.
          app.find('.table-freeze-scrolling').exists().should.be.false;
          await app.get('#public-link-create .btn-link').trigger('click');
          app.get('.table-freeze-scrolling th').text().should.equal('region');
        }));
  });
});
