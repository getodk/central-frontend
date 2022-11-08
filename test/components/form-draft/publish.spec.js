import { RouterLinkStub } from '@vue/test-utils';

import FormDraftPublish from '../../../src/components/form-draft/publish.vue';
import FormVersionRow from '../../../src/components/form-version/row.vue';

import useForm from '../../../src/request-data/form';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';
import Property from '../../util/ds-property-enum';

const mountOptions = (options = undefined) => ({
  props: { state: false },
  container: {
    router: mockRouter('/projects/1/forms/f/draft'),
    requestData: testRequestData([useForm], {
      formVersions: testData.extendedFormVersions.published(),
      formDraft: testData.extendedFormDrafts.last(),
      attachments: testData.standardFormAttachments.sorted(),
      formDraftDatasetDiff: testData.formDraftDatasetDiffs.sorted()
    })
  },
  ...options
});

describe('FormDraftPublish', () => {
  beforeEach(mockLogin);

  describe('modal toggles', () => {
    it('toggles the modal', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft', { root: false })
        .testModalToggles({
          modal: FormDraftPublish,
          show: '#form-draft-status-publish-button',
          hide: '.btn-link'
        });
    });

    // The modal renders two .modal-actions elements. The test above tests the
    // first; this tests the second.
    it('hides the modal if the version string input is shown', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      const modal = mount(FormDraftPublish, mountOptions());
      await modal.setProps({ state: true });
      await modal.get('.btn-link').trigger('click');
      modal.emitted().hide.should.eql([[]]);
    });
  });

  describe('warnings', () => {
    it('shows a warning if an attachment is missing', async () => {
      testData.extendedForms.createPast(1, { draft: true, submissions: 1 });
      testData.standardFormAttachments.createPast(1, { blobExists: false });
      const modal = mount(FormDraftPublish, mountOptions());
      await modal.setProps({ state: true });
      modal.findAll('.modal-warnings li').length.should.equal(1);
      const { to } = modal.getComponent(RouterLinkStub).props();
      to.should.equal('/projects/1/forms/f/draft/attachments');
    });

    it('shows a warning if there are no test submissions', async () => {
      const now = new Date().toISOString();
      // The form has a submission, but the draft does not.
      testData.extendedProjects.createPast(1, {
        forms: 1,
        lastSubmission: now
      });
      testData.extendedForms.createPast(1, {
        submissions: 1,
        lastSubmission: now
      });
      testData.extendedFormVersions.createPast(1, { draft: true });
      const modal = mount(FormDraftPublish, mountOptions());
      await modal.setProps({ state: true });
      modal.findAll('.modal-warnings li').length.should.equal(1);
      const { to } = modal.getComponent(RouterLinkStub).props();
      to.should.equal('/projects/1/forms/f/draft/testing');
    });

    it('shows both warnings if both conditions are true', async () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1, { blobExists: false });
      const modal = mount(FormDraftPublish, mountOptions());
      await modal.setProps({ state: true });
      modal.findAll('.modal-warnings li').length.should.equal(2);
    });

    it('does not show a warning if neither condition is true', async () => {
      testData.extendedForms.createPast(1, { draft: true, submissions: 1 });
      const modal = mount(FormDraftPublish, mountOptions());
      await modal.setProps({ state: true });
      modal.find('.modal-warnings').exists().should.be.false();
    });
  });

  describe('version string input', () => {
    it('shows input if version string of draft is same as a previous version', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { version: 'v2' });
      testData.extendedFormVersions.createPast(1, {
        version: 'v1',
        draft: true
      });
      const modal = mount(FormDraftPublish, mountOptions());
      await modal.setProps({ state: true });
      modal.get('input').should.be.visible();
      // Explanatory text
      modal.findAll('.modal-introduction p').length.should.equal(3);
      modal.findAll('form p').length.should.equal(1);
    });

    it('does not show input if version string of draft is different', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, {
        version: 'v2',
        draft: true
      });
      const modal = mount(FormDraftPublish, mountOptions());
      await modal.setProps({ state: true });
      modal.find('input').exists().should.be.false();
      modal.findAll('.modal-introduction p').length.should.equal(3);
    });

    it('does not show the input for a form without a published version', async () => {
      testData.extendedForms.createPast(1, { draft: true });
      const modal = mount(FormDraftPublish, mountOptions());
      await modal.setProps({ state: true });
      modal.find('input').exists().should.be.false();
      modal.findAll('.modal-introduction p').length.should.equal(3);
    });

    it('focuses the input', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      const modal = mount(FormDraftPublish, mountOptions({
        attachTo: document.body
      }));
      await modal.setProps({ state: true });
      modal.get('input').should.be.focused();
    });

    it('defaults the input to the version string of the draft', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { version: 'v2' });
      testData.extendedFormVersions.createPast(1, {
        version: 'v1',
        draft: true
      });
      const modal = mount(FormDraftPublish, mountOptions());
      await modal.setProps({ state: true });
      modal.get('input').element.value.should.equal('v1');
    });

    it('resets the input if the modal is hidden', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      const modal = mount(FormDraftPublish, mountOptions());
      await modal.setProps({ state: true });
      const input = modal.get('input');
      await input.setValue('v2');
      await modal.setProps({ state: false });
      await modal.setProps({ state: true });
      input.element.value.should.equal('v1');
    });
  });

  describe('standard button things', () => {
    it('implements things if the version string input is shown', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return mockHttp()
        .mount(FormDraftPublish, mountOptions())
        .afterResponses(modal => modal.setProps({ state: true }))
        .testStandardButton({
          button: '.btn-primary',
          request: (modal) => modal.get('form').trigger('submit'),
          disabled: ['.btn-link'],
          modal: true
        });
    });

    it('implements things if the version string input is not shown', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return mockHttp()
        .mount(FormDraftPublish, mountOptions())
        .afterResponses(modal => modal.setProps({ state: true }))
        .testStandardButton({
          button: '.btn-primary',
          disabled: ['.btn-link'],
          modal: true
        });
    });
  });

  describe('request', () => {
    it('posts to the correct endpoint', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return mockHttp()
        .mount(FormDraftPublish, mountOptions())
        .request(async (modal) => {
          await modal.setProps({ state: true });
          return modal.get('.btn-primary').trigger('click');
        })
        .beforeEachResponse((_, { method, url }) => {
          method.should.equal('POST');
          url.should.equal('/v1/projects/1/forms/f/draft/publish');
        })
        .respondWithProblem();
    });

    it('specifies ?version if version string input differs from draft', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return mockHttp()
        .mount(FormDraftPublish, mountOptions())
        .request(async (modal) => {
          await modal.setProps({ state: true });
          await modal.get('input').setValue('v2');
          return modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { url }) => {
          url.should.equal('/v1/projects/1/forms/f/draft/publish?version=v2');
        })
        .respondWithProblem();
    });

    it('does not specify ?version if input is same as draft', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { version: 'v2' });
      testData.extendedFormVersions.createPast(1, {
        version: 'v1',
        draft: true
      });
      return mockHttp()
        .mount(FormDraftPublish, mountOptions())
        .request(async (modal) => {
          await modal.setProps({ state: true });
          return modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { url }) => {
          url.should.equal('/v1/projects/1/forms/f/draft/publish');
        })
        .respondWithProblem();
    });

    it('does not specify ?version if there is no input', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return mockHttp()
        .mount(FormDraftPublish, mountOptions())
        .request(async (modal) => {
          await modal.setProps({ state: true });
          return modal.get('.btn-primary').trigger('click');
        })
        .beforeEachResponse((_, { url }) => {
          url.should.equal('/v1/projects/1/forms/f/draft/publish');
        })
        .respondWithProblem();
    });
  });

  it('shows a custom alert message for a version string duplicate', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { draft: true });
    return mockHttp()
      .mount(FormDraftPublish, mountOptions())
      .request(async (modal) => {
        await modal.setProps({ state: true });
        return modal.get('form').trigger('submit');
      })
      .respondWithProblem(409.6)
      .afterResponse(modal => {
        modal.should.alert(
          'danger',
          'The version name of this Draft conflicts with a past version of this Form or a deleted Form. Please use the field below to change it to something new or upload a new Form definition.'
        );
      });
  });

  it('shows the version input field after request returns duplicate version problem', () => {
    // The scenario here is a user trying to publish a form that conflicts with
    // a form/version combo probably found in the trash. This component doesn't
    // have access to trashed forms so it doesn't know about the problem until the
    // request from the backend returns the problem.
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { version: 'v2', draft: true });
    return mockHttp()
      .mount(FormDraftPublish, mountOptions())
      .request(async (modal) => {
        await modal.setProps({ state: true });
        return modal.get('#form-draft-publish .btn-primary').trigger('click');
      })
      .respondWithProblem(409.6)
      .afterResponse(modal => {
        modal.should.alert('danger');
        modal.get('input').should.be.visible();
        // Explanatory text does not include last duplicate draft paragraph
        // because that explanation appears in the alert in this scenario.
        modal.findAll('.modal-introduction p').length.should.equal(2);
        modal.findAll('form p').length.should.equal(1);
      });
  });

  it('does not show the version input field if backend returns a different problem', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { version: 'v2', draft: true });
    return mockHttp()
      .mount(FormDraftPublish, mountOptions())
      .request(async (modal) => {
        await modal.setProps({ state: true });
        return modal.get('#form-draft-publish .btn-primary').trigger('click');
      })
      .respondWithProblem(500.1)
      .afterResponse(modal => {
        modal.should.alert('danger');
        modal.find('input').exists().should.be.false();
        modal.findAll('.modal-introduction p').length.should.equal(3);
      });
  });

  describe('after a successful response', () => {
    const publish = () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (app) => {
          await app.get('#form-draft-status-publish-button').trigger('click');
          return app.get('#form-draft-publish .btn-primary').trigger('click');
        })
        .respondWithData(() => {
          testData.extendedFormDrafts.publish(-1);
          return { success: true };
        })
        .respondWithData(() => testData.extendedForms.last())
        .respondWithData(() => testData.extendedProjects.last());
    };

    it('sends requests for the project and form', () =>
      publish().testRequests([
        null,
        { url: '/v1/projects/1/forms/f', extended: true },
        { url: '/v1/projects/1', extended: true }
      ]));

    it('shows a success alert', () =>
      publish().then(app => {
        app.should.alert('success');
      }));

    it('redirects to the form overview', () =>
      publish().then(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/f');
      }));

    it('updates requestData', async () => {
      const app = await publish();
      const { requestData } = app.vm.$container;
      requestData.localResources.formVersions.dataExists.should.be.false();
      requestData.formDraft.isEmpty().should.be.true();
      requestData.attachments.isEmpty().should.be.true();
    });

    it('shows the create draft button', () =>
      publish().then(app => {
        app.get('#form-head-create-draft-button').should.be.visible();
      }));

    it('shows the published version in .../versions', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, {
        version: 'v2',
        draft: true
      });
      return load('/projects/1/forms/f/versions')
        .afterResponses(app => {
          app.findAllComponents(FormVersionRow).length.should.equal(1);
        })
        .route('/projects/1/forms/f/draft')
        .request(async (app) => {
          await app.get('#form-draft-status-publish-button').trigger('click');
          return app.get('#form-draft-publish .btn-primary').trigger('click');
        })
        .respondWithData(() => {
          testData.extendedFormDrafts.publish(-1);
          return { success: true };
        })
        .respondWithData(() => testData.extendedForms.last())
        .respondWithData(() => testData.extendedProjects.last())
        .complete()
        .route('/projects/1/forms/f/versions')
        .respondWithData(() => testData.extendedFormVersions.sorted())
        .afterResponse(app => {
          app.findAllComponents(FormVersionRow).length.should.equal(2);
        });
    });

    it('allows navigation to Datasets tab if publish creates first dataset', () =>
      publish()
        .beforeAnyResponse(() => {
          testData.extendedProjects.update(-1, { datasets: 1 });
          testData.extendedDatasets.createPast(1);
        })
        .complete()
        .load('/projects/1/datasets', { project: false })
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/datasets');
        }));
  });

  it('shows dataset delta', async () => {
    testData.extendedForms.createPast(1, { draft: true, entityRelated: true });
    testData.formDraftDatasetDiffs.createPast(1, { isNew: true, properties: [Property.NewProperty] });
    testData.formDraftDatasetDiffs.createPast(1, { isNew: false, properties: [Property.NewProperty, Property.InFormProperty, Property.DefaultProperty] });
    const modal = mount(FormDraftPublish, mountOptions());
    await modal.setProps({ state: true });

    const delta = modal.findAll('.dataset-list li');

    let liCounter = -1;
    testData.formDraftDatasetDiffs.sorted().forEach(ds => {
      if (ds.isNew) {
        delta[liCounter += 1].text().should.match(/A new Dataset \w+ will be created./);
      }
      ds.properties.forEach(p => {
        if (p.isNew) {
          delta[liCounter += 1].text().should.match(/In Dataset \w+, a new property \w+ will be created./);
        }
      });
    });
  });
});
