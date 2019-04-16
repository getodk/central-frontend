import Spinner from '../../../lib/components/spinner.vue';
import UserList from '../../../lib/components/user/list.vue';
import UserRow from '../../../lib/components/user/row.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin, mockRouteThroughLogin } from '../../session';
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

    it('redirects a user without a grant to assignment.list', () => {
      mockLogin({ verbs: ['project.list', 'user.list'] });
      return mockRoute('/account/edit')
        .complete()
        .route('/users')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.standardUsers.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    it('redirects a user without a grant to user.list', () => {
      mockLogin({ verbs: ['project.list', 'assignment.list'] });
      return mockRoute('/account/edit')
        .complete()
        .route('/users')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1).sorted())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    it('navigates to /users after a click on the navbar link', () => {
      mockLogin();
      return mockRoute('/account/edit')
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
      mockHttp()
        .mount(UserList)
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .beforeEachResponse(component => {
          component.find('thead tr').length.should.equal(1);
        }));

    it('lists the users in the correct order', () =>
      mockHttp()
        .mount(UserList)
        .respondWithData(() => testData.standardUsers
          .createPast(1, { email: 'b@email.com' })
          .sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(component => {
          const rows = component.find('table tbody tr');
          const emails = rows.map(row => row.first('td').text());
          emails.should.eql(['a@email.com', 'b@email.com']);
        }));

    it('correctly renders the role selects', () =>
      mockHttp()
        .mount(UserList)
        .respondWithData(() => testData.standardUsers
          .createPast(1, { email: 'b@email.com', role: 'none' })
          .sorted())
        .respondWithData(() =>
          [testData.toActor(testData.standardUsers.first())])
        .afterResponses(component => {
          const selects = component.find('table select');
          selects.map(select => select.element.value).should.eql(['admin', '']);
          selects.map(select => $(select.element).find(':selected').text())
            .should
            .eql(['Administrator', 'None']);
        }));

    it('renders the role select correctly for the current user', () =>
      mockHttp()
        .mount(UserList)
        .respondWithData(() => testData.standardUsers.createPast(1).sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(component => {
          const { currentUser } = component.vm.$store.state.request.data;
          for (const tr of component.find('table tbody tr')) {
            const select = tr.first('select');
            const { disabled, title } = select.element;
            const td = tr.first('td');
            const isCurrentUser = td.text() === currentUser.email;
            disabled.should.equal(isCurrentUser);
            (title !== '').should.equal(isCurrentUser);
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
        ({ rowIndex, selectValue, route = false }) =>
          (route ? mockHttp().mount(UserList) : mockRoute('/users'))
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
            .request(component => {
              const select = component.find('table select')[rowIndex];
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
              .beforeEachResponse((component, config) => {
                config.method.should.equal(method);
              })
              .respondWithSuccess());

          it('disables the select during the request', () =>
            loadUsersAndChangeRole({ rowIndex, selectValue })
              .beforeAnyResponse(component => {
                const select = component.find('table select')[rowIndex];
                select.getAttribute('disabled').should.equal('disabled');
              })
              .respondWithSuccess());

          it('shows a spinner during the request', () =>
            loadUsersAndChangeRole({ rowIndex, selectValue })
              .beforeAnyResponse(component => {
                const rows = component.find(UserRow);
                rows[rowIndex].first(Spinner).getProp('state').should.be.true();
              })
              .respondWithSuccess());

          it('shows a success alert after the response', () =>
            loadUsersAndChangeRole({ rowIndex, selectValue, route: true })
              .respondWithSuccess()
              .afterResponse(app => {
                app.should.alert(
                  'success',
                  `Success! Person ${rowIndex} has been given a Project Role of “${roleName}” on this Project.`
                );
              }));
        });
      }
    });
  });
});
