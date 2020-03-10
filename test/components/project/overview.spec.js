import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ProjectOverview', () => {
  beforeEach(mockLogin);

  it('does not send a new request if user navigates back to tab', () => {
    testData.extendedProjects.createPast(1);
    return load('/projects/1')
      .complete()
      .route('/projects/1/settings')
      .complete()
      .route('/projects/1')
      .testNoRequest();
  });

  it('shows a message if there are no forms', () => {
    testData.extendedProjects.createPast(1);
    return load('/projects/1').then(app => {
      app.first('#project-overview .empty-table-message').should.be.visible();
    });
  });
});
