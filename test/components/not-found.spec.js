import { mockHttp } from '../http';

describe('NotFound', () => {
  it('does not send a request, including to restore the session', () =>
    mockHttp()
      .route('/not-found'));

  // This might not be the ideal behavior, but this test documents the current
  // behavior.
  it('navigating away does not restore the session', () =>
    mockHttp()
      .route('/not-found')
      .complete()
      // Specify request() without a response.
      .request(app => {
        app.vm.$router.push('/login');
      }));
});
