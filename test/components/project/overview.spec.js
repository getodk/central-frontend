import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRoute } from '../../util/http';

describe('ProjectOverview', () => {
  beforeEach(mockLogin);

  it('does not send a new request if user navigates back to tab', () =>
    mockRoute('/projects/1')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() => testData.extendedForms.sorted())
      .complete()
      .route('/projects/1/settings')
      .complete()
      .route('/projects/1')
      .testNoRequest());
});
