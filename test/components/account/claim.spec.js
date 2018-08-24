import Navbar from '../../../lib/components/navbar.vue';
import testData from '../../data';
import { fillForm, trigger } from '../../util';
import { mockRoute } from '../../http';
import { mockRouteThroughLogin } from '../../session';

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

  it('navbar is visible', () =>
    mockRoute(LOCATION)
      .then(app => {
        app.first(Navbar).vm.$el.style.display.should.equal('');
      }));

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

  describe('navigation to /account/claim', () => {
    it('redirects to the root page after a login through the login page', () => {
      const { xmlFormId } = testData.extendedForms.createPast(1).last();
      return mockRouteThroughLogin(`/forms/${xmlFormId}`)
        .respondWithData(() => testData.extendedForms.last())
        .respondWithData(() => testData.simpleFieldKeys.sorted())
        .complete()
        .route(LOCATION)
        .respondWithProblems([500, 500, 500])
        .afterResponses(app => app.vm.$route.path.should.equal('/'));
    });
  });
});
