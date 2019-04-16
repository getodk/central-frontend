import UserList from '../../../lib/components/user/list.vue';
import UserNew from '../../../lib/components/user/new.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { submitForm, trigger } from '../../event';

describe('UserNew', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('does not show the modal initially', () =>
      mockHttp()
        .mount(UserList)
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(component => {
          component.first(UserNew).getProp('state').should.be.false();
        }));

    describe('after button click', () => {
      it('shows the modal', () =>
        mockHttp()
          .mount(UserList)
          .respondWithData(() => testData.standardUsers.sorted())
          .respondWithData(() =>
            testData.standardUsers.sorted().map(testData.toActor))
          .afterResponses(component =>
            trigger.click(component, '#user-list-new-button'))
          .then(component => {
            component.first(UserNew).getProp('state').should.be.true();
          }));

      it('focuses the email input', () =>
        mockRoute('/users', { attachToDocument: true })
          .respondWithData(() => testData.standardUsers.sorted())
          .respondWithData(() =>
            testData.standardUsers.sorted().map(testData.toActor))
          .afterResponses(app =>
            trigger.click(app, '#user-list-new-button'))
          .then(app => {
            app.first('#user-new [type="email"]').should.be.focused();
          }));
    });
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(UserNew)
      .request(modal => submitForm(modal, 'form', [
        ['input[type="email"]', 'new@email.com']
      ]))
      .standardButton());

  describe('successful submit', () => {
    const submitWithSuccess = ({ route = false } = {}) =>
      (route ? mockRoute('/users') : mockHttp().mount(UserList))
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .complete()
        .request(component => trigger.click(component, '#user-list-new-button')
          .then(() => submitForm(component, '#user-new form', [
            ['input[type="email"]', testData.standardUsers.createNew().email]
          ])))
        .respondWithData(() => testData.standardUsers.last())
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor));

    it('hides the modal', () =>
      submitWithSuccess().afterResponses(component => {
        component.first(UserNew).getProp('state').should.be.false();
      }));

    it('does not show the table data while it refreshes the data', () =>
      submitWithSuccess().beforeEachResponse((component, config, index) => {
        if (index !== 0) component.find('tbody tr').length.should.equal(0);
      }));

    it('refreshes the data', () =>
      submitWithSuccess().afterResponses(component => {
        component.find('tbody tr').length.should.equal(2);
      }));

    it('shows a success alert', () =>
      submitWithSuccess({ route: true }).afterResponses(app => {
        app.should.alert('success');
      }));
  });
});
