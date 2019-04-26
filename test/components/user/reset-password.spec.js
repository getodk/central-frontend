import UserResetPassword from '../../../lib/components/user/reset-password.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { trigger } from '../../util';

describe('UserResetPassword', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('does not show the modal initially', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(app => {
          app.first(UserResetPassword).getProp('state').should.be.false();
        }));

    it('shows the modal after the reset password action is clicked', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(app =>
          trigger.click(app, '#user-list-table .reset-password'))
        .then(app => {
          app.first(UserResetPassword).getProp('state').should.be.true();
        }));
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(UserResetPassword, {
        propsData: { user: testData.standardUsers.first() }
      })
      .request(component =>
        trigger.click(component, '#user-reset-password-button'))
      .standardButton('#user-reset-password-button'));

  describe('after successful response', () => {
    let app;
    beforeEach(() => mockRoute('/users')
      .respondWithData(() => testData.standardUsers.sorted())
      .respondWithData(() =>
        testData.standardUsers.sorted().map(testData.toActor))
      .afterResponse(component => {
        app = component;
      })
      .request(() => trigger.click(app, '#user-list-table .reset-password')
        .then(() => trigger.click(app, '#user-reset-password-button')))
      .respondWithSuccess());

    it('modal hides', () => {
      app.first(UserResetPassword).getProp('state').should.be.false();
    });

    it('success message is shown', () => {
      app.should.alert('success');
    });
  });
});
