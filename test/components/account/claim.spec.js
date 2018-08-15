import { fillForm, trigger } from '../../util';
import { mockRoute } from '../../http';

const LOCATION = { path: '/account/claim', query: { token: 'a'.repeat(64) } };
const submitForm = (wrapper) =>
  fillForm(wrapper, [['#account-claim input[type="password"]', 'password']])
    .then(() => trigger.submit(wrapper.first('#account-claim form')))
    .then(() => wrapper);

describe('AccountClaim', () => {
  it('field is focused', () =>
    mockRoute(LOCATION, { attachToDocument: true })
      .then(app => app.first('input[type="password"]').should.be.focused()));

  it('standard button thinking things', () =>
    // We need mockRoute() and not just mockHttp(), because the token is taken
    // from the URL.
    mockRoute(LOCATION)
      .complete()
      .request(submitForm)
      .standardButton());

  describe('after successful response', () => {
    let app;
    beforeEach(() => mockRoute(LOCATION)
      .complete()
      .request(submitForm)
      .respondWithSuccess()
      .afterResponse(component => {
        app = component;
      }));

    it('user is redirected to login', () => {
      app.vm.$route.path.should.equal('/login');
    });

    it('success message is shown', () => app.should.alert('success'));
  });
});
