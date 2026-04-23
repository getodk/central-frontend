import NotFound from '../../../src/components/not-found.vue';
import Breadcrumbs from '../../../src/components/breadcrumbs.vue';
import SubmissionDelete from '../../../src/components/submission/delete.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('SubmissionShow', () => {
  beforeEach(mockLogin);

  it('requires the projectId route param to be integer', async () => {
    const component = await load('/projects/p/forms/f/submissions/s', {
      root: false
    });
    component.findComponent(NotFound).exists().should.be.true;
  });

  it('renders breadcrumbs with links', async () => {
    testData.extendedProjects.createPast(1, { name: 'My Project' });
    testData.extendedForms.createPast(1, { name: 'My Form', xmlFormId: 'a b', submissions: 1 });
    testData.extendedSubmissions.createPast(1, { instanceId: 's' });
    const component = await load('/projects/1/forms/a%20b/submissions/s', {
      root: false
    });
    const { links } = component.getComponent(Breadcrumbs).props();
    links[0].text.should.equal('My Project');
    links[0].path.should.equal('/projects/1');
    links[1].text.should.equal('My Form');
    links[1].path.should.equal('/projects/1/forms/a%20b');
    links[2].text.should.equal('s');
    should.not.exist(links[2].path);
  });

  it('renders the xmlformid of the form in the breadcrumb if it has no name', async () => {
    testData.extendedProjects.createPast(1, { name: 'My Project' });
    testData.extendedForms.createPast(1, { name: null, xmlFormId: 'a b', submissions: 1 });
    testData.extendedSubmissions.createPast(1, { instanceId: 's' });
    const component = await load('/projects/1/forms/a%20b/submissions/s', {
      root: false
    });
    const { links } = component.getComponent(Breadcrumbs).props();
    links[0].text.should.equal('My Project');
    links[0].path.should.equal('/projects/1');
    links[1].text.should.equal('a b');
    links[1].path.should.equal('/projects/1/forms/a%20b');
    links[2].text.should.equal('s');
    should.not.exist(links[2].path);
  });

  it('shows the instance name if the submission has one', async () => {
    testData.extendedSubmissions.createPast(1, {
      instanceId: 's',
      meta: { instanceName: 'My Submission' }
    });
    const component = await load('/projects/1/forms/f/submissions/s', {
      root: false
    });
    component.get('#page-head-title').text().should.equal('My Submission');
  });

  it('shows instance ID if submission does not have an instance name', async () => {
    testData.extendedSubmissions.createPast(1, { instanceId: 's' });
    const component = await load('/projects/1/forms/f/submissions/s', {
      root: false
    });
    component.get('#page-head-title').text().should.equal('s');
  });

  describe('delete', () => {
    it('toggles the modal', () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 'e' });
      return load('/projects/1/forms/f/submissions/e', { root: false })
        .testModalToggles({
          modal: SubmissionDelete,
          show: '#submission-activity-delete-button',
          hide: '.btn-link'
        });
    });

    it('sends the correct request', () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 'e' });
      return load('/projects/1/forms/f/submissions/e', { root: false })
        .complete()
        .request(async (component) => {
          await component.get('#submission-activity-delete-button').trigger('click');
          return component.get('#submission-delete .btn-danger').trigger('click');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'DELETE',
          url: '/v1/projects/1/forms/f/submissions/e'
        }]);
    });

    it('implements some standard button things', () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 'e' });
      return load('/projects/1/forms/f/submissions/e', { root: false })
        .afterResponses(component =>
          component.get('#submission-activity-delete-button').trigger('click'))
        .testStandardButton({
          button: '#submission-delete .btn-danger',
          disabled: ['#submission-delete .btn-link'],
          modal: SubmissionDelete
        });
    });

    it('does not show the delete button if user does not have submission delete permission', async () => {
      testData.extendedUsers.reset();
      testData.sessions.reset();
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer' });
      testData.extendedSubmissions.createPast(1, { instanceId: 'e' });
      return load('/projects/1/forms/f/submissions/e', { root: false })
        .afterResponses(component => {
          component.find('#submission-activity-delete-button').exists().should.be.false;
        });
    });

    describe('after a successful response', () => {
      const del = () => {
        testData.extendedSubmissions.createPast(1, { instanceId: 'e' });
        return load('/projects/1/forms/f/submissions/e')
          .complete()
          .request(async (app) => {
            await app.get('#submission-activity-delete-button').trigger('click');
            return app.get('#submission-delete .btn-danger').trigger('click');
          })
          .respondWithSuccess()
          .respondFor('/projects/1/forms/f/submissions', {
            project: false
          });
      };

      it('redirects to the Data page', async () => {
        const app = await del();
        const { path } = app.vm.$route;
        path.should.equal('/projects/1/forms/f/submissions');
      });

      it('shows a success alert', async () => {
        const app = await del();
        app.should.alert('success', 'Submission has been successfully deleted.');
      });
    });

    it('ignores the 404 error', () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 'e' });
      return load('/projects/1/forms/f/submissions/e')
        .complete()
        .request(async (app) => {
          await app.get('#submission-activity-delete-button').trigger('click');
          return app.get('#submission-delete .btn-danger').trigger('click');
        })
        .respondWithProblem(404.1)
        .respondFor('/projects/1/forms/f/submissions', {
          project: false
        })
        .afterResponses((app) => {
          app.should.alert('success', 'Submission has been successfully deleted.');
        });
    });
  });
});
