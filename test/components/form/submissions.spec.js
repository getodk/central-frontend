import EnketoFill from '../../../src/components/enketo/fill.vue';
import SubmissionDownloadButton from '../../../src/components/submission/download-button.vue';

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

    it('shows the count for the form, not the form draft', async () => {
      testData.extendedForms.createPast(1, { submissions: 1 });
      testData.extendedFormVersions.createPast(1, {
        draft: true,
        submissions: 2
      });
      testData.extendedSubmissions.createPast(1);
      const component = await load('/projects/1/forms/f/submissions', {
        root: false
      });
      const text = component.getComponent(SubmissionDownloadButton).text();
      text.should.equal('Download');
    });

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
          component.find('#submission-list-refresh-button').trigger('click');
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
