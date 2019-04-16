import { mockLogin } from '../session';
import { mockRoute } from '../http';

describe('NotFound', () => {
  it('does not send a request, including to restore the session', () =>
    mockRoute('/not-found')
      .respondWithData([/* no responses */]));

  // This might not be the ideal behavior, but this test documents the current
  // behavior.
  it('does not restore the session if the user navigates away', () =>
    mockRoute('/not-found')
      .complete()
      .route('/login')
      .respondWithData([/* no responses */]));

  it('is accessible by a user who is logged in', () => {
    mockLogin();
    return mockRoute('/account/edit')
      .complete()
      .route('/not-found')
      .respondWithData([/* no responses */]);
  });
});
