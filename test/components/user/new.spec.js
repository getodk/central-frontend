import UserList from '../../../lib/components/user/list.vue';
import UserNew from '../../../lib/components/user/new.vue';
import testData from '../../data';
import { fillForm, submitForm, trigger } from '../../event';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';

describe('UserNew', () => {
  beforeEach(() => {
    mockLogin({ email: 'some@email.com', displayName: 'Some Name' });
  });

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

    describe('after the create button is clicked', () => {
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

    it('resets the modal when it is hidden', () =>
      mockHttp()
        .mount(UserList)
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(component =>
          trigger.click(component, '#user-list-new-button'))
        .then(component =>
          fillForm(component.first('#user-new form'), [
            ['input[type="email"]', 'new@email.com'],
            ['input[type="text"]', 'New Name']
          ])
            .then(() => component))
        .then(component => trigger.click(component, '#user-new .btn-link'))
        .then(component => trigger.click(component, '#user-list-new-button'))
        .then(component => {
          const modal = component.first('#user-new');
          modal.first('input[type="email"]').element.value.should.equal('');
          modal.first('input[type="text"]').element.value.should.equal('');
        }));
  });

  describe('display name', () => {
    it('includes the display name in the request if it is specified', () =>
      mockHttp()
        .mount(UserNew)
        .request(modal => submitForm(modal, 'form', [
          ['input[type="email"]', 'new@email.com'],
          ['input[type="text"]', 'New Name']
        ]))
        .beforeEachResponse((modal, config) => {
          config.data.displayName.should.equal('New Name');
        })
        .respondWithProblem());

    it('does not include display name in request if it is not specified', () =>
      mockHttp()
        .mount(UserNew)
        .request(modal => submitForm(modal, 'form', [
          ['input[type="email"]', 'new@email.com']
        ]))
        .beforeEachResponse((modal, config) => {
          should.not.exist(config.data.displayName);
        })
        .respondWithProblem());
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
            ['input[type="email"]', 'new@email.com']
          ])))
        .respondWithData(() => testData.standardUsers.createNew({
          email: 'new@email.com',
          displayName: 'new@email.com'
        }))
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

    it('includes display name in alert even if it was not specified', () =>
      submitWithSuccess().afterResponses(app => {
        const message = app.first('#app-alert .alert-message').text();
        const { displayName } = testData.extendedUsers.last();
        message.should.containEql(displayName);
      }));
  });
});
