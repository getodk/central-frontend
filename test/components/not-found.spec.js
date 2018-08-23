import { mockRoute } from '../http';

describe('NotFound', () => {
  it('does not send a request, including to restore the session', () =>
    mockRoute('/not-found'));

  // This might not be the ideal behavior, but this test documents the current
  // behavior.
  it('navigating away does not restore the session', () =>
    mockRoute('/not-found')
      .complete()
      // Route without specifying a response.
      .route('/login'));
});
