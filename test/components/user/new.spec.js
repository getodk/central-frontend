import UserList from '../../../lib/components/user/list.vue';
import UserNew from '../../../lib/components/user/new.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { submitForm, trigger } from '../../event';

describe('UserNew', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('is initially hidden', () =>
      mockHttp()
        .mount(UserList)
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(component => {
          component.first(UserNew).getProp('state').should.be.false();
        }));

    describe('after button click', () => {
      it('modal is shown', () =>
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

      it('email input is focused', () =>
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

  it('standard button thinking things', () =>
    mockHttp()
      .mount(UserNew)
      .request(modal => submitForm(modal, 'form', [
        ['input[type="email"]', 'new@email.com']
      ]))
      .standardButton());

  describe('after successful submit', () => {
    let app;
    beforeEach(() => mockRoute('/users')
      .respondWithData(() => testData.standardUsers.sorted())
      .respondWithData(() =>
        testData.standardUsers.sorted().map(testData.toActor))
      .afterResponses(component => {
        app = component;
      })
      .request(() => trigger.click(app, '#user-list-new-button')
        .then(() => submitForm(app, '#user-new form', [
          ['input[type="email"]', testData.standardUsers.createNew().email]
        ])))
      .respondWithData(() => testData.standardUsers.last())
      .respondWithData(() => testData.standardUsers.sorted())
      .respondWithData(() =>
        testData.standardUsers.sorted().map(testData.toActor)));

    it('modal is hidden', () => {
      app.first(UserNew).getProp('state').should.be.false();
    });

    it('table has the correct number of rows', () => {
      app.find('#user-list-table tbody tr').length.should.equal(2);
    });

    it('success message is shown', () => {
      app.should.alert('success');
    });
  });
});
