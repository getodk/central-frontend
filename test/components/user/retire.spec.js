import UserRetire from '../../../src/components/user/retire.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

describe('UserRetire', () => {
  beforeEach(() => {
    mockLogin({ email: 'b@email.com', displayName: 'Person B' });
  });

  it('shows the modal after the retire user action is clicked', () =>
    mockRoute('/users')
      .respondWithData(() =>
        testData.standardUsers.createPast(1, { email: 'a@email.com' }).sorted())
      .respondWithData(() =>
        testData.standardUsers.sorted().map(testData.toActor))
      .afterResponses(app => {
        app.first(UserRetire).getProp('state').should.be.false();
        return app;
      })
      .then(app => trigger.click(app, '#user-list-table .retire-user'))
      .then(app => {
        app.first(UserRetire).getProp('state').should.be.true();
      }));

  describe('current user', () => {
    it('disables the menu item for the retire user action', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(app => {
          const action = app.first('#user-list-table .retire-user');
          action.element.parentNode.should.be.disabled();
        }));

    it('adds a title to the menu item for the retire user action', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(app => {
          const action = app.first('#user-list-table .retire-user');
          action.element.parentNode.title.should.be.ok();
        }));

    it('does not show the modal after the retire user action is clicked', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(app =>
          trigger.click(app, '#user-list-table .retire-user'))
        .then(app => {
          app.first(UserRetire).getProp('state').should.be.false();
        }));
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(UserRetire, {
        propsData: {
          user: testData.standardUsers
            .createPast(1, { email: 'a@email.com' })
            .last()
        }
      })
      .request(modal => trigger.click(modal, '.btn-danger'))
      .standardButton('.btn-danger'));

  describe('after a successful response', () => {
    const retire = () => mockRoute('/users')
      .respondWithData(() => testData.standardUsers
        .createPast(1, { email: 'a@email.com', displayName: 'Person A' })
        .sorted())
      .respondWithData(() =>
        testData.standardUsers.sorted().map(testData.toActor))
      .complete()
      .request(app => trigger.click(app, '#user-list-table .retire-user')
        .then(() => trigger.click(app, '#user-retire .btn-danger')))
      .respondWithSuccess()
      .respondWithData(() => {
        testData.extendedUsers.splice(1, 1);
        return testData.standardUsers.sorted();
      })
      .respondWithData(() =>
        testData.standardUsers.sorted().map(testData.toActor));

    it('hides the modal', () =>
      retire().afterResponses(app => {
        app.first(UserRetire).getProp('state').should.be.false();
      }));

    it('shows a success alert', () =>
      retire().afterResponses(app => {
        app.should.alert('success');
        const message = app.first('#app-alert .alert-message').text();
        message.should.containEql('Person A');
      }));

    it('renders the correct number of rows', () =>
      retire().afterResponses(app => {
        app.find('#user-list-table tbody tr').length.should.equal(1);
      }));
  });
});
