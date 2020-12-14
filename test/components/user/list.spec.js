import Spinner from '../../../src/components/spinner.vue';
import UserRow from '../../../src/components/user/row.vue';
import testData from '../../data';
import { load, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

describe('UserList', () => {
  describe('routing', () => {
    it('redirects a user with no sitewide role', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/users')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1).sorted())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/');
        });
    });
  });

  describe('after login as an administrator', () => {
    beforeEach(() => {
      mockLogin({ email: 'a@email.com' });
    });

    it('shows the table headers while data is loading', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .beforeEachResponse(app => {
          app.find('#user-list-table thead tr').length.should.equal(1);
        }));

    it('correctly renders the display name', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(app => {
          const link = app.first('#user-list-table td a');
          link.getAttribute('href').should.equal('#/users/1/edit');
          const user = testData.standardUsers.last();
          link.text().trim().should.equal(user.displayName);
          link.getAttribute('title').should.equal(user.displayName);
        }));

    it('shows the email', () =>
      load('/users').then(app => {
        const td = app.first('.user-row-email');
        td.text().trim().should.equal('a@email.com');
        td.getAttribute('title').should.equal('a@email.com');
      }));

    it('correctly renders the edit profile action', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(app => {
          const link = app.first('#user-list-table .edit-profile');
          link.getAttribute('href').should.equal('#/users/1/edit');
        }));

    it('correctly renders the role selects', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers
          .createPast(1, { email: 'b@email.com', role: 'none' })
          .sorted())
        .respondWithData(() =>
          [testData.toActor(testData.standardUsers.first())])
        .afterResponses(app => {
          const selects = app.find('#user-list-table select');
          selects.map(select => select.element.value).should.eql(['admin', '']);
          selects.map(select => $(select.element).find(':selected').text())
            .should
            .eql(['Administrator', 'None']);
        }));

    it('renders the role select correctly for the current user', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers.createPast(1).sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(app => {
          const { currentUser } = app.vm.$store.state.request.data;
          for (const tr of app.find('#user-list-table tbody tr')) {
            const email = tr.find('td')[1].text();
            const isCurrentUser = email === currentUser.email;
            const select = tr.first('select');
            if (isCurrentUser)
              select.should.be.disabled();
            else
              select.should.not.be.disabled();
            select.hasAttribute('title').should.equal(isCurrentUser);
          }
        }));

    describe('changing a role', () => {
      const loadUsersAndChangeRole =
        ({ rowIndex, selectValue }) =>
          mockRoute('/users')
            .respondWithData(() => testData.standardUsers
              .createPast(1, {
                displayName: 'Person 1',
                email: 'b@email.com',
                role: 'admin'
              })
              .createPast(1, {
                displayName: 'Person 2',
                email: 'c@email.com',
                role: 'none'
              })
              .sorted())
            .respondWithData(() =>
              testData.standardUsers.sorted().slice(0, 2).map(testData.toActor))
            .complete()
            .request(app => trigger.changeValue(
              app.find('#user-list-table select')[rowIndex],
              selectValue
            ));

      // Array of test cases, where each case is an array with the following
      // structure:
      //
      //   [row index, role name, new select value, request method]
      //
      const cases = [
        [1, 'None', 'none', 'DELETE'],
        [2, 'Administrator', 'admin', 'POST']
      ];
      for (const [rowIndex, roleName, selectValue, method] of cases) {
        describe(`changing to ${selectValue}`, () => {
          it('sends the request using the correct method', () =>
            loadUsersAndChangeRole({ rowIndex, selectValue })
              .beforeEachResponse((app, config) => {
                config.method.should.equal(method);
              })
              .respondWithSuccess());

          it('disables the select during the request', () =>
            loadUsersAndChangeRole({ rowIndex, selectValue })
              .beforeAnyResponse(app => {
                const select = app.find('#user-list-table select')[rowIndex];
                select.should.be.disabled();
              })
              .respondWithSuccess()
              .afterResponse(app => {
                const select = app.find('#user-list-table select')[rowIndex];
                select.should.not.be.disabled();
              }));

          it('shows a spinner during the request', () =>
            loadUsersAndChangeRole({ rowIndex, selectValue })
              .beforeAnyResponse(app => {
                const rows = app.find(UserRow);
                rows[rowIndex].first(Spinner).getProp('state').should.be.true();
              })
              .respondWithSuccess());

          it('shows a success alert after the response', () =>
            loadUsersAndChangeRole({ rowIndex, selectValue })
              .respondWithSuccess()
              .afterResponse(app => {
                app.should.alert('success');
                const message = app.first('#app-alert .alert-message').text();
                message.should.containEql(`Person ${rowIndex}`);
                message.should.containEql(roleName);
              }));
        });
      }
    });
  });
});
