import EnketoFill from '../../../src/components/enketo/fill.vue';

import testData from '../../data';
import { findTab } from '../../util/dom';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormSubmissions', () => {
  describe('new submission button', () => {
    it('shows the button to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedForms.createPast(1);
      const component = await load('/projects/1/forms/f/submissions', {
        root: false
      });
      component.getComponent(EnketoFill).should.be.visible();
    });

    it('does not render the button for a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1);
      const component = await load('/projects/1/forms/f/submissions', {
        root: false
      });
      component.findComponent(EnketoFill).exists().should.be.false;
    });
  });

  describe('submission count', () => {
    beforeEach(mockLogin);

    it('updates the tab badge if the count changes', () => {
      testData.extendedForms.createPast(1, { submissions: 10 });
      testData.extendedSubmissions.createPast(11);
      return load('/projects/1/forms/f/settings')
        .afterResponses(app => {
          findTab(app, 'Submissions').get('.badge').text().should.equal('10');
        })
        .route('/projects/1/forms/f/submissions')
        .respondForComponent('FormSubmissions')
        .complete()
        .route('/projects/1/forms/f/settings')
        .then(app => {
          findTab(app, 'Submissions').get('.badge').text().should.equal('11');
        });
    });

    it('should not change submission count when viewing deleted submissions', () => {
      testData.extendedForms.createPast(1, { submissions: 5 });
      testData.extendedSubmissions.createPast(5);
      testData.extendedSubmissions.createPast(2, { deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions')
        .afterResponses(app => {
          findTab(app, 'Submissions').get('.badge').text().should.equal('5');
        })
        .complete()
        .request(app => {
          app.find('.toggle-deleted-submissions').text().should.equal('2 deleted Submissions');
          return app.find('.toggle-deleted-submissions').trigger('click');
        })
        .respondWithData(() => testData.submissionDeletedOData())
        .afterResponses(app => {
          findTab(app, 'Submissions').get('.badge').text().should.equal('5');
        });
    });

    it('correctly updates submission count through delete and restore operations', () => {
      testData.extendedForms.createPast(1, { submissions: 5 });
      testData.extendedSubmissions.createPast(5);
      testData.extendedSubmissions.createPast(2, { deletedAt: new Date().toISOString() });

      return load('/projects/1/forms/f/submissions')
        .afterResponses(app => {
          findTab(app, 'Submissions').get('.badge').text().should.equal('5');
          app.find('.toggle-deleted-submissions').text().should.equal('2 deleted Submissions');
        })
        .complete()
        .request(async app => {
          await app.get('.submission-metadata-row .delete-button').trigger('click');
          return app.get('#submission-delete .btn-danger').trigger('click');
        })
        .respondWithSuccess()
        .afterResponse(app => {
          findTab(app, 'Submissions').get('.badge').text().should.equal('4');
          app.find('.toggle-deleted-submissions').text().should.equal('3 deleted Submissions');
        })
        .request(async app => {
          await app.get('.submission-metadata-row .delete-button').trigger('click');
          return app.get('#submission-delete .btn-danger').trigger('click');
        })
        .respondWithSuccess()
        .afterResponse(app => {
          findTab(app, 'Submissions').get('.badge').text().should.equal('3');
        })
        .request(app => app.get('.toggle-deleted-submissions').trigger('click'))
        .respondWithData(() => testData.submissionDeletedOData())
        .afterResponse(app => {
          findTab(app, 'Submissions').get('.badge').text().should.equal('3');
        })
        .request(async app => {
          await app.get('.submission-metadata-row .restore-button').trigger('click');
          return app.get('#submission-restore .btn-danger').trigger('click');
        })
        .respondWithSuccess()
        .afterResponse(app => {
          findTab(app, 'Submissions').get('.badge').text().should.equal('4');
        });
    });
  });

  describe('deleted submissions', () => {
    beforeEach(mockLogin);

    it('does not show deleted submission button', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedSubmissions.createPast(1);
      const component = await load('/projects/1/forms/f/submissions', {
        root: false
      });
      component.find('.toggle-deleted-submissions').exists().should.be.false;
    });

    it('shows deleted submission button', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedSubmissions.createPast(1);
      testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
      const component = await load('/projects/1/forms/f/submissions', {
        root: false
      });
      const showDeletedButton = component.find('.toggle-deleted-submissions');
      showDeletedButton.exists().should.be.true;
      showDeletedButton.text().should.equal('1 deleted Submission');
    });

    it('updates the deleted count on refresh', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedSubmissions.createPast(1);
      testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions', {
        root: false
      })
        .afterResponses((component) => {
          const showDeletedButton = component.find('.toggle-deleted-submissions');
          showDeletedButton.text().should.equal('1 deleted Submission');
        })
        .request((component) => {
          component.find('#refresh-button').trigger('click');
        })
        .beforeAnyResponse(() => {
          testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
        })
        .respondWithData(() => testData.submissionOData())
        .respondWithData(() => testData.submissionDeletedOData())
        .afterResponses((component) => {
          const showDeletedButton = component.find('.toggle-deleted-submissions');
          showDeletedButton.text().should.equal('2 deleted Submissions');
        });
    });

    it('updates the url when deleted submissions are shown', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedSubmissions.createPast(1);
      testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions')
        .complete()
        .request((component) => {
          const showDeletedButton = component.find('.toggle-deleted-submissions');
          showDeletedButton.trigger('click');
        })
        .respondWithData(() => testData.submissionDeletedOData())
        .afterResponses((component) => {
          const { deleted } = component.vm.$route.query;
          deleted.should.be.equal('true');
        });
    });

    it('disables the odata access button when deleted submissions are shown', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedSubmissions.createPast(1);
      testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions')
        .complete()
        .request((component) =>
          component.find('.toggle-deleted-submissions').trigger('click'))
        .respondWithData(() => testData.submissionDeletedOData())
        .afterResponses((component) => {
          component.getComponent('#odata-data-access').props().analyzeDisabled.should.be.true;
        });
    });
  });
});
