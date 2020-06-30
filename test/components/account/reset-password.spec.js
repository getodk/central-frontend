import testData from '../../data';
import { mockRoute } from '../../util/http';
import { submitForm } from '../../util/event';

describe('AccountResetPassword', () => {
  describe('routing', () => {
    it('redirects if user navigates to /reset-password, then session is restored', () =>
      mockRoute('/reset-password')
        .restoreSession(true)
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.administrators.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));
  });

  it('focuses the input', () =>
    mockRoute('/reset-password', { attachToDocument: true })
      .restoreSession(false)
      .afterResponse(app => {
        const input = app.first('#account-reset-password input[type="email"]');
        input.should.be.focused();
      }));

  it('implement some standard button things', () =>
    mockRoute('/reset-password')
      .restoreSession(false)
      .complete()
      .request(app => submitForm(app, '#account-reset-password form', [
        ['input[type="email"]', testData.administrators.createPast(1).last().email]
      ]))
      .standardButton());

  describe('after a successful response', () => {
    let app;
    beforeEach(() => mockRoute('/reset-password')
      .restoreSession(false)
      .complete()
      .request(component => {
        app = component;
        return submitForm(app, '#account-reset-password form', [
          ['input[type="email"]', testData.administrators.createPast(1).last().email]
        ]);
      })
      .respondWithSuccess());

    it('redirects to login', () => {
      app.vm.$route.path.should.equal('/login');
    });

    it('shows a success alert', () => {
      app.should.alert('success');
    });
  });
});
