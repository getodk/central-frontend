import testData from '../data';
import { mockLogin } from '../util/session';
import { mockRoute } from '../util/http';

describe('NotFound', () => {
  it('does not send a request, including to restore the session', () =>
    mockRoute('/not-found')
      .testNoRequest());

  it('does not restore the session if the user navigates away', () =>
    mockRoute('/not-found')
      .complete()
      .route('/login')
      .testNoRequest());

  it('is accessible to a user who is logged in', () => {
    mockLogin();
    return mockRoute('/account/edit')
      .respondWithData(() => testData.standardUsers.first())
      .complete()
      .route('/not-found')
      .testNoRequest();
  });
});
