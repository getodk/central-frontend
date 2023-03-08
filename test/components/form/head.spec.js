import FormDraftStatus from '../../../src/components/form-draft/status.vue';
import FormHead from '../../../src/components/form/head.vue';
import FormOverview from '../../../src/components/form/overview.vue';
import Loading from '../../../src/components/loading.vue';
import PageBack from '../../../src/components/page/back.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormHead', () => {
  describe('names and links', () => {
    beforeEach(mockLogin);

    it("shows the project's name", () => {
      testData.extendedProjects.createPast(1, { name: 'My Project', forms: 1 });
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f').then(app => {
        app.get('#page-back-title').text().should.equal('My Project');
      });
    });

    it("appends (archived) to an archived project's name", () => {
      testData.extendedProjects.createPast(1, {
        name: 'My Project',
        archived: true,
        forms: 1
      });
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f').then(app => {
        const text = app.get('#page-back-title').text();
        text.should.equal('My Project (archived)');
      });
    });

    it("renders the project's name as a link", async () => {
      testData.extendedForms.createPast(1);
      const component = await load('/projects/1/forms/f');
      const { to } = component.getComponent(PageBack).props();
      to.should.eql(['/projects/1', '/projects/1']);
    });

    it("shows the form's name", async () => {
      testData.extendedForms.createPast(1, { name: 'My Form' });
      const app = await load('/projects/1/forms/f');
      const h1 = app.get('#form-head-form-nav .h1');
      h1.text().should.equal('My Form');
      await h1.should.have.textTooltip();
    });

    it("shows the form's xmlFormId if the form does not have a name", async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'my_form', name: null });
      const app = await load('/projects/1/forms/my_form');
      const h1 = app.get('#form-head-form-nav .h1');
      h1.text().should.equal('my_form');
      await h1.should.have.textTooltip();
    });
  });

  describe('tabs', () => {
    it('shows all tabs to an administrator', () => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1, { blobExists: false });
      return load('/projects/1/forms/f/draft').then(app => {
        const tabs = app.findAll('#form-head-form-nav .nav-tabs a');
        tabs.map(tab => tab.text()).should.eql([
          'Overview',
          'Versions',
          'Submissions',
          'Public Access',
          'Settings',
          'Status',
          'Form Attachments 1',
          'Testing'
        ]);
      });
    });

    it('shows only select tabs to a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      return load('/projects/1/forms/f/draft/testing').then(app => {
        const tabs = app.findAll('#form-head-form-nav .nav-tabs a');
        const text = tabs.map(tab => tab.text());
        text.should.eql(['Versions', 'Submissions', 'Testing']);
      });
    });

    it('disables tabs for a form without a published version', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true });
      const app = await load('/projects/1/forms/f/draft');
      const tabs = app.findAll('#form-head-form-tabs li');
      tabs.length.should.equal(5);
      for (const tab of tabs) {
        tab.classes('disabled').should.be.true();
        const a = tab.get('a');
        a.should.have.ariaDescription('These functions will become available once you publish your Draft Form');
        await a.should.have.tooltip();
      }
    });

    it('does not disable tabs for a form with a published version', async () => {
      mockLogin();
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      const app = await load('/projects/1/forms/f/draft');
      const tabs = app.findAll('#form-head-form-tabs li');
      tabs.length.should.equal(5);
      for (const tab of tabs) {
        tab.classes('disabled').should.be.false();
        const a = tab.get('a');
        a.should.not.have.ariaDescription();
        await a.should.not.have.tooltip();
      }
    });
  });

  describe('Form Attachments tab', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true });
    });

    it('is not shown if there are no form attachments', () =>
      load('/projects/1/forms/f/draft').then(app => {
        const tabs = app.findAll('#form-head-draft-nav .nav-tabs a');
        tabs.map(tab => tab.text()).should.eql(['Status', 'Testing']);
      }));

    it('is shown if there are form attachments', () => {
      testData.standardFormAttachments.createPast(2, { blobExists: false });
      return load('/projects/1/forms/f/draft').then(app => {
        const tabs = app.findAll('#form-head-draft-nav .nav-tabs a');
        const text = tabs.map(tab => tab.text());
        text.should.eql(['Status', 'Form Attachments 2', 'Testing']);
      });
    });

    describe('badge', () => {
      it('shows the correct count if all form attachments are missing', () => {
        testData.standardFormAttachments.createPast(2, { blobExists: false });
        return load('/projects/1/forms/f/draft/attachments').then(app => {
          const badge = app.get('#form-head-draft-nav .nav-tabs .badge');
          badge.text().should.equal('2');
        });
      });

      it('shows correct count if only some form attachments are missing', () => {
        testData.standardFormAttachments
          .createPast(1, { blobExists: true })
          .createPast(2, { blobExists: false });
        return load('/projects/1/forms/f/draft/attachments').then(app => {
          const badge = app.get('#form-head-draft-nav .nav-tabs .badge');
          badge.text().should.equal('2');
        });
      });

      it('is not shown if all form attachments exist', () => {
        testData.standardFormAttachments.createPast(2, { blobExists: true });
        return load('/projects/1/forms/f/draft/attachments').then(app => {
          const badge = app.get('#form-head-draft-nav .nav-tabs .badge');
          badge.should.be.hidden();
        });
      });
    });
  });

  describe('no draft', () => {
    it('does not render the draft nav for a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/submissions').then(app => {
        app.find('#form-head-draft-nav').exists().should.be.false();
      });
    });

    it('does not show the tabs for the form draft to an administrator', () => {
      mockLogin();
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f').then(app => {
        app.get('#form-head-draft-nav .nav-tabs').should.be.hidden();
      });
    });

    describe('create draft button', () => {
      beforeEach(() => {
        mockLogin();
        testData.extendedForms.createPast(1);
      });

      it('shows the button to an administrator', () =>
        load('/projects/1/forms/f').then(app => {
          app.get('#form-head-create-draft-button').should.be.visible();
        }));

      it('posts to the correct endpoint', () =>
        load('/projects/1/forms/f')
          .complete()
          .request(app => app.get('#form-head-create-draft-button').trigger('click'))
          .beforeEachResponse((_, { method, url }) => {
            method.should.equal('POST');
            url.should.equal('/v1/projects/1/forms/f/draft');
          })
          .respondWithProblem());

      it('redirects to .../draft after a successful response', () =>
        load('/projects/1/forms/f')
          .complete()
          .request(app => app.get('#form-head-create-draft-button').trigger('click'))
          .respondWithSuccess()
          .respondFor('/projects/1/forms/f/draft', {
            project: false,
            form: false,
            formDraft: () =>
              testData.extendedFormDrafts.createNew({ draft: true })
          })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/projects/1/forms/f/draft');
          }));

      it('shows a danger alert after a Problem response', () =>
        load('/projects/1/forms/f')
          .complete()
          .request(app => app.get('#form-head-create-draft-button').trigger('click'))
          .beforeAnyResponse(app => {
            app.should.not.alert();
          })
          .respondWithProblem()
          .afterResponse(app => {
            app.should.alert('danger');
          }));

      it('shows a loading message during the request', () =>
        load('/projects/1/forms/f')
          .complete()
          .request(app => app.get('#form-head-create-draft-button').trigger('click'))
          .beforeAnyResponse(app => {
            app.getComponent(Loading).should.be.visible();
            app.getComponent(FormHead).should.be.hidden();
            app.getComponent(FormOverview).element.parentNode.should.be.hidden();
          })
          .respondWithSuccess()
          .respondFor('/projects/1/forms/f/draft', {
            project: false,
            form: false,
            formAttachments: false,
            formDraft: () =>
              testData.extendedFormDrafts.createNew({ draft: true })
          })
          .afterResponses(app => {
            app.getComponent(Loading).should.be.hidden();
            app.getComponent(FormHead).should.be.visible();
            app.getComponent(FormDraftStatus).should.be.visible();
          }));
    });
  });
});
