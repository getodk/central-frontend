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
      draftAttachments: testData.standardFormAttachments.sorted(),
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
          show: '#form-edit-publish-button',
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
      modal.find('.modal-warnings').exists().should.be.false;
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
      modal.find('input').exists().should.be.false;
      modal.findAll('.modal-introduction p').length.should.equal(3);
    });

    it('does not show the input for a form without a published version', async () => {
      testData.extendedForms.createPast(1, { draft: true });
      const modal = mount(FormDraftPublish, mountOptions());
      await modal.setProps({ state: true });
      modal.find('input').exists().should.be.false;
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

  it('shows a custom alert message for a duplicate property name', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { version: 'v2', draft: true });
    return mockHttp()
      .mount(FormDraftPublish, mountOptions())
      .request(async (modal) => {
        await modal.setProps({ state: true });
        return modal.get('#form-draft-publish .btn-primary').trigger('click');
      })
      .respondWithProblem({
        code: 409.17,
        message: 'This Form attempts to create new Entity properties that match with existing ones except for capitalization.',
        details: { duplicateProperties: [{ current: 'first_name', provided: 'FIRST_NAME' }] }
      })
      .afterResponse(modal => {
        modal.should.alert(
          'danger',
          /This Form attempts to create a new Entity property that matches with an existing one except for capitalization:.*FIRST_NAME \(existing: first_name\)/s
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
        modal.find('input').exists().should.be.false;
        modal.findAll('.modal-introduction p').length.should.equal(3);
      });
  });

  describe('after a successful response', () => {
    const respondToPublish = (series) => series
      .respondWithData(() => {
        testData.extendedFormDrafts.publish(-1);
        return { success: true };
      })
      .respondWithData(() => testData.extendedProjects.last())
      .respondWithData(() => testData.extendedForms.last())
      .respondWithData(() => testData.standardFormAttachments.sorted()) // publishedAttachments
      .respondWithData(() => testData.formDatasetDiffs.sorted());
    const publish = () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (app) => {
          await app.get('#form-edit-publish-button').trigger('click');
          return app.get('#form-draft-publish .btn-primary').trigger('click');
        })
        .modify(respondToPublish);
    };

    it('sends the correct requests', () =>
      publish().testRequests([
        null,
        { url: '/v1/projects/1', extended: true },
        { url: '/v1/projects/1/forms/f', extended: true },
        { url: '/v1/projects/1/forms/f/attachments' },
        { url: '/v1/projects/1/forms/f/dataset-diff' }
      ]));

    it('hides the modal', () =>
      publish()
        .afterResponses(app => {
          // After the form draft is published, the modal is removed from the
          // DOM.
          app.findComponent(FormDraftPublish).exists().should.be.false;
        })
        .request(app =>
          app.get('#form-edit-create-draft-button').trigger('click'))
        .respondWithData(() => {
          testData.extendedFormVersions.createNew({ draft: true });
          return { success: true };
        })
        .respondForComponent('FormEdit')
        .afterResponses(app => {
          // After a new draft is created, the modal should be rendered, but it
          // should still be hidden.
          app.getComponent(FormDraftPublish).props().state.should.be.false;
        }));

    it('shows a success alert', async () => {
      const app = await publish();
      app.should.alert('success');
    });

    it('updates requestData', async () => {
      const app = await publish();
      const { requestData } = app.vm.$container;
      requestData.localResources.formVersions.dataExists.should.be.false;
      requestData.localResources.formDraft.isEmpty().should.be.true;
      requestData.localResources.draftAttachments.dataExists.should.be.false;
    });

    it('shows the create draft button', async () => {
      const app = await publish();
      app.get('#form-edit-create-draft-button').should.be.visible();
    });

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
        .respondForComponent('FormEdit', { formVersions: false })
        .complete()
        .request(async (app) => {
          await app.get('#form-edit-publish-button').trigger('click');
          return app.get('#form-draft-publish .btn-primary').trigger('click');
        })
        .modify(respondToPublish)
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
        .load('/projects/1/entity-lists', { project: false })
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/entity-lists');
        }));
  });

  it('shows the number of new entity properties', async () => {
    testData.extendedForms.createPast(1, { draft: true, entityRelated: true });
    testData.formDraftDatasetDiffs.createPast(1, { isNew: true, properties: [Property.NewProperty] });
    testData.formDraftDatasetDiffs.createPast(1, { isNew: false, properties: [Property.NewProperty, Property.InFormProperty, Property.DefaultProperty] });
    const modal = mount(FormDraftPublish, mountOptions());
    await modal.setProps({ state: true });
    const text = modal.get('hr + p').text();
    text.should.startWith('Publishing this draft will create 2 properties.');
  });
});
