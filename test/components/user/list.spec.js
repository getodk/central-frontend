import Spinner from '../../../lib/components/spinner.vue';
import UserRow from '../../../lib/components/user/row.vue';
import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';
import { trigger } from '../../event';

describe('UserList', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/users')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/users')
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/users');
        }));

    it('redirects a user without a grant to user.list', () => {
      mockLogin({
        verbs: [
          'project.list',
          'assignment.list',
          'user.create',
          'assignment.create',
          'assignment.delete',
          'user.password.invalidate',
          'user.delete'
        ]
      });
      return mockRoute('/users')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1).sorted())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    const verbs = [
      'assignment.list',
      'user.create',
      'assignment.create',
      'assignment.delete',
      'user.password.invalidate',
      'user.delete'
    ];
    for (const verb of verbs) {
      it(`redirects a user without a grant to ${verb}`, () => {
        const currentUserVerbs = [
          'project.list',
          'user.list',
          ...verbs.filter(v => v !== verb)
        ];
        mockLogin({ verbs: currentUserVerbs });
        return mockRoute('/users')
          .respondWithData(() =>
            testData.extendedProjects.createPast(1).sorted())
          .respondWithData(() => testData.standardUsers.sorted())
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          });
      });
    }

    it('navigates to /users after a click on the navbar link', () => {
      mockLogin();
      return mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .complete()
        .request(app => trigger.click(app, '#navbar-users-link'))
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/users');
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

    it('lists the users in the correct order', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers
          .createPast(1, { email: 'b@email.com' })
          .sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(app => {
          const rows = app.find('#user-list-table tbody tr');
          const emails = rows.map(row => row.find('td')[1].text());
          emails.should.eql(['a@email.com', 'b@email.com']);
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
            (select.element.title !== '').should.equal(isCurrentUser);
          }
        }));

    it('refreshes data after a click on the refresh button', () =>
      mockRoute('/users').testRefreshButton({
        collection: testData.standardUsers,
        respondWithData: [
          () => testData.standardUsers.sorted(),
          () => testData.standardUsers.sorted().map(testData.toActor)
        ]
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
              testData.toActor(testData.standardUsers.sorted().slice(0, 2)))
            .complete()
            .request(app => {
              const select = app.find('#user-list-table select')[rowIndex];
              if (select.element.value === selectValue)
                throw new Error('no change');
              select.element.value = selectValue;
              return trigger.change(select);
            });

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
