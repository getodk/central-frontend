import ProjectSubmissionOptions from '../../../src/components/project/submission-options.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FieldKeyList', () => {
  beforeEach(mockLogin);

  it('toggles the "Submission Options" modal', () => {
    testData.extendedProjects.createPast(1);
    return load('/projects/1/app-users').testModalToggles(
      ProjectSubmissionOptions,
      '.heading-with-button a[href="#"]',
      '.btn-primary'
    );
  });

  it('shows a message if there are no app users', () => {
    testData.extendedProjects.createPast(1, { appUsers: 0 });
    return load('/projects/1/app-users').then(app => {
      app.find('.empty-table-message').length.should.equal(1);
    });
  });
});
