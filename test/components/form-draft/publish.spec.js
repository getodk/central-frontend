import FormDraftPublish from '../../../src/components/form-draft/publish.vue';
import testData from '../../data';
import { fillForm, submitForm, trigger } from '../../util/event';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

const showModal = (attachToDocument = false) =>
  load('/projects/1/forms/f/draft/status', { attachToDocument }, {})
    .afterResponses(trigger.click('#form-draft-status-publish-button'));

describe('FormDraftPublish', () => {
  beforeEach(mockLogin);

  describe('modal toggles', () => {
    it('toggles the modal', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft/status').testModalToggles(
        FormDraftPublish,
        '#form-draft-status-publish-button',
        '.btn-link'
      );
    });

    // The modal renders two .modal-actions elements.
    it('hides the modal if the version string input is shown', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return showModal()
        .then(trigger.click('#form-draft-publish .btn-link'))
        .then(app => {
          app.first(FormDraftPublish).getProp('state').should.be.false();
        });
    });
  });

  describe('warnings', () => {
    it('shows a warning if an attachment is missing', () => {
      testData.extendedForms.createPast(1, { draft: true, submissions: 1 });
      testData.standardFormAttachments.createPast(1, { exists: false });
      return showModal().then(app => {
        const warnings = app.find('#form-draft-publish .modal-warnings li');
        warnings.length.should.equal(1);
        const href = warnings[0].first('a').getAttribute('href');
        href.should.equal('#/projects/1/forms/f/draft/attachments');
      });
    });

    it('shows a warning if there are no test submissions', () => {
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
      return showModal().then(app => {
        const warnings = app.find('#form-draft-publish .modal-warnings li');
        warnings.length.should.equal(1);
        const href = warnings[0].first('a').getAttribute('href');
        href.should.equal('#/projects/1/forms/f/draft/testing');
      });
    });

    it('shows both warnings if both conditions are true', () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1, { exists: false });
      return showModal().then(app => {
        const warnings = app.find('#form-draft-publish .modal-warnings li');
        warnings.length.should.equal(2);
      });
    });

    it('does not show a warning if neither condition is true', () => {
      testData.extendedForms.createPast(1, { draft: true, submissions: 1 });
      return showModal().then(app => {
        app.find('#form-draft-publish .modal-warnings').length.should.equal(0);
      });
    });
  });

  describe('version string input', () => {
    it('shows input if version string of draft is same as primary version', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return showModal().then(app => {
        const modal = app.first('#form-draft-publish');
        modal.first('input').should.be.visible();
        // Explanatory text
        modal.find('.modal-introduction p').length.should.equal(3);
      });
    });

    it('does not show input if version string of draft is different', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, {
        version: 'v2',
        draft: true
      });
      return showModal().then(app => {
        const modal = app.first('#form-draft-publish');
        modal.find('input').length.should.equal(0);
        modal.find('.modal-introduction p').length.should.equal(2);
      });
    });

    it('does not show the input for a form without a published version', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return showModal().then(app => {
        const modal = app.first('#form-draft-publish');
        modal.find('input').length.should.equal(0);
        modal.find('.modal-introduction p').length.should.equal(2);
      });
    });

    it('focuses the input', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return showModal(true).then(app => {
        app.first('#form-draft-publish input').should.be.focused();
      });
    });

    it('defaults the input to the current version string', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return showModal().then(app => {
        app.first('#form-draft-publish input').element.value.should.equal('v1');
      });
    });

    it('resets the input if the modal is hidden', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return showModal()
        .then(app => {
          const modal = app.first('#form-draft-publish');
          return fillForm(modal, [['input', 'v2']])
            .then(trigger.click('.btn-link'))
            .then(() => app);
        })
        .then(trigger.click('#form-draft-status-publish-button'))
        .then(app => {
          const { value } = app.first('#form-draft-publish input').element;
          value.should.equal('v1');
        });
    });
  });

  describe('standard button things', () => {
    it('implements things if the version string input is shown', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return showModal().testStandardButton({
        button: '#form-draft-publish .btn-primary',
        request: trigger.submit('#form-draft-publish form'),
        disabled: ['#form-draft-publish .btn-link'],
        modal: FormDraftPublish
      });
    });

    it('implements things if the version string input is not shown', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return showModal().testStandardButton({
        button: '#form-draft-publish .btn-primary',
        disabled: ['#form-draft-publish .btn-link'],
        modal: FormDraftPublish
      });
    });
  });

  describe('request', () => {
    it('posts to the correct endpoint', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return showModal()
        .request(trigger.click('#form-draft-publish .btn-primary'))
        .beforeEachResponse((modal, { method, url }) => {
          method.should.equal('POST');
          url.should.equal('/v1/projects/1/forms/f/draft/publish');
        })
        .respondWithProblem();
    });

    it('specifies ?version if version string input differs from current string', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return showModal()
        .request(app =>
          submitForm(app, '#form-draft-publish form', [['input', 'v2']]))
        .beforeEachResponse((app, { url }) => {
          url.should.equal('/v1/projects/1/forms/f/draft/publish?version=v2');
        })
        .respondWithProblem();
    });

    it('does not specify ?version if input is same as current string', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return showModal()
        .request(trigger.submit('#form-draft-publish form'))
        .beforeEachResponse((app, { url }) => {
          url.should.equal('/v1/projects/1/forms/f/draft/publish');
        })
        .respondWithProblem();
    });

    it('does not specify ?version if there is no input', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return showModal()
        .request(trigger.click('#form-draft-publish .btn-primary'))
        .beforeEachResponse((app, { url }) => {
          url.should.equal('/v1/projects/1/forms/f/draft/publish');
        })
        .respondWithProblem();
    });
  });

  it('shows a custom alert message for a version string duplicate', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { draft: true });
    return showModal()
      .request(trigger.submit('#form-draft-publish form'))
      .respondWithProblem(409.6)
      .afterResponse(app => {
        app.first(FormDraftPublish).should.alert(
          'danger',
          "The version name you've specified conflicts with a past version of this Form. Please change it to something new and try again."
        );
      });
  });

  describe('after a successful response', () => {
    const publish = () => {
      testData.extendedForms.createPast(1, { draft: true });
      return showModal()
        .request(trigger.click('#form-draft-publish .btn-primary'))
        .respondWithSuccess()
        .respondWithData(() => {
          testData.extendedFormDrafts.publish(-1);
          return testData.extendedForms.last();
        })
        .respondWithData(() => []); // formActors
    };

    it('shows a success alert', () =>
      publish().then(app => {
        app.should.alert('success');
      }));

    it('redirects to the form overview', () =>
      publish().then(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/f');
      }));

    it('shows the create draft button', () =>
      publish().then(app => {
        app.first('#form-head-create-draft-button').should.be.visible();
      }));
  });
});
