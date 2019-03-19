import ProjectUserList from '../../../../lib/components/project/user/list.vue';
import Spinner from '../../../../lib/components/spinner.vue';
import testData from '../../../data';
import { mockHttp, mockRoute } from '../../../http';
import { mockLogin, mockRouteThroughLogin } from '../../../session';
import { trigger } from '../../../event';

const loadProjectUsers = ({ count, currentUser = false, route = false }) => {
  const users = testData.administrators
    .createPast(count - (currentUser ? 1 : 0))
    .sorted();
  const managers = currentUser
    ? users
    : users.filter(user => user !== testData.administrators.first());
  if (route) {
    return mockRoute('/projects/1/users')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() => managers);
  }
  return mockHttp()
    .mount(ProjectUserList, {
      propsData: { projectId: '1' },
      requestData: { currentUser: testData.administrators.first() }
    })
    .respondWithData(() => managers);
};
// Changes the select of the first row of the table to a new value, triggering a
// `change` event.
const changeRole = (component, selectValue) => {
  const select = component.first('#project-user-list select');
  if (select.element.value === selectValue) throw new Error('no change');
  select.element.value = selectValue;
  return trigger.change(select).then(() => component);
};
// Changes the search term to a new value, triggering a `change` event.
const changeQ = (component, q) => {
  const input = component.first('#project-user-list-search-form input');
  if (input.element.value === q) throw new Error('no change');
  input.element.value = q;
  return trigger.change(input).then(() => component);
};

describe('ProjectUserList', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/projects/1/users')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/projects/1/users')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => []) // managers
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/users');
        }));
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    describe('during initial fetch of managers', () => {
      it('disables the search button', () =>
        loadProjectUsers({ count: 0 }).beforeEachResponse(component => {
          const input = component.first('#project-user-list-search-form input');
          input.getAttribute('disabled').should.be.ok();
        }));

      it('hides the .close button', () =>
        loadProjectUsers({ count: 0 }).beforeEachResponse(component => {
          component.first('.close').should.be.hidden();
        }));
    });

    it('shows the table headers and a message if there are no managers', () =>
      loadProjectUsers({ count: 0 })
        .afterResponse(component => {
          const tr = component.find('thead tr');
          tr.length.should.equal(1);
          component.first('.empty-table-message').should.be.visible();
        }));

    it('shows the current managers in the table', () =>
      loadProjectUsers({ count: 2, currentUser: true })
        .afterResponse(component => {
          const tr = component.find('table tbody tr');
          tr.length.should.equal(2);
          const users = testData.administrators.sorted();
          for (let i = 0; i < tr.length; i += 1) {
            const td = tr[i].find('td');
            td.length.should.equal(2);
            td[0].text().should.equal(users[i].displayName);
            const selected = td[1].find('option')
              .filter(option => option.element.selected);
            selected.length.should.equal(1);
            selected[0].text().should.equal('Manager');
          }
        }));

    it('renders the select correctly for the current user', () =>
      loadProjectUsers({ count: 2, currentUser: true })
        .afterResponse(component => {
          const currentUser = testData.administrators.first();
          for (const tr of component.find('table tbody tr')) {
            const select = tr.first('select');
            const { disabled, title } = select.element;
            const td = tr.first('td');
            const isCurrentUser = td.text() === currentUser.displayName;
            disabled.should.equal(isCurrentUser);
            (title !== '').should.equal(isCurrentUser);
          }
        }));

    it('sends a DELETE request if None is selected', () =>
      loadProjectUsers({ count: 1 })
        .complete()
        .request(component => changeRole(component, ''))
        .beforeEachResponse((component, config) => {
          config.method.should.equal('DELETE');
        })
        .respondWithSuccess());

    it('sends a POST request if Manager is re-selected', () =>
      loadProjectUsers({ count: 1 })
        .complete()
        .request(component => changeRole(component, ''))
        .respondWithSuccess()
        .complete()
        .request(component => changeRole(component, 'manager'))
        .beforeEachResponse((component, config) => {
          config.method.should.equal('POST');
        })
        .respondWithSuccess());

    // testAssignmentRequest() tests what happens during and after an assignment
    // request. loadAndRequest(route) is expected to first mount the component,
    // mocking the route if `route` is `true`, then send an assignment request.
    const testAssignmentRequest = (loadAndRequest) => {
      describe('during a POST or DELETE request', () => {
        it('disables the select', () =>
          loadAndRequest(false)
            .beforeEachResponse(component => {
              component.first('select').getAttribute('disabled').should.be.ok();
            })
            .respondWithSuccess());

        it('shows a spinner', () =>
          loadAndRequest(false)
            .beforeEachResponse(component => {
              component.first(Spinner).getProp('state').should.be.true();
            })
            .respondWithSuccess());

        it('disables the search button', () =>
          loadAndRequest(false)
            .beforeEachResponse(component => {
              const form = component.first('#project-user-list-search-form');
              form.first('input').getAttribute('disabled').should.be.ok();
            })
            .respondWithSuccess());
      });

      it('shows a success alert after a POST or DELETE request', () =>
        loadAndRequest(true)
          .respondWithSuccess()
          .afterResponse(app => {
            app.should.alert();
          }));
    };

    testAssignmentRequest((route) =>
      loadProjectUsers({ count: 1, currentUser: false, route })
        .complete()
        .request(component => changeRole(component, '')));

    describe('search', () => {
      // Loads two managers, then submits a search that returns four users, one
      // of whom is a manager.
      const search = (route = false) => loadProjectUsers({ count: 2, route })
        .complete()
        .request(component => changeQ(component, 'some search term'))
        .respondWithData(() => [
          // We set the first element to a non-manager in order to facilitate
          // the use of changeRole(). (The order of the search results should
          // not matter.)
          testData.administrators.createPast(1).last(),
          testData.administrators.createPast(1).last(),
          testData.administrators.createPast(1).last(),
          testData.administrators.get(1)
        ]);

      describe('during the search request', () => {
        it('hides the managers', () =>
          search().beforeEachResponse(component => {
            component.find('tbody tr').should.be.empty();
          }));

        it('shows the .close button', () =>
          search().beforeEachResponse(component => {
            component.first('.close').should.be.visible();
          }));

        it('allows another search, canceling the first search', () =>
          search()
            .beforeEachResponse((component, config, index) => {
              const input = component.first('#project-user-list-search-form input');
              input.element.disabled.should.be.false();
              component.find('tbody tr').should.be.empty();
              return index === 0
                ? changeQ(component, 'some other search term')
                : null;
            })
            .respondWithData(() => []));
      });

      describe('after a successful response to the search request', () => {
        it('shows the search results', () =>
          search().afterResponse(component => {
            const tr = component.find('table tbody tr');
            tr.length.should.equal(4);
            const userCount = testData.administrators.size;
            const manager = testData.administrators.get(1);
            const users = [
              testData.administrators.get(userCount - 3),
              testData.administrators.get(userCount - 2),
              testData.administrators.get(userCount - 1),
              manager
            ];
            for (let i = 0; i < tr.length; i += 1) {
              const td = tr[i].find('td');
              td[0].text().should.equal(users[i].displayName);
              const selected = td[1].find('option')
                .filter(option => option.element.selected);
              selected.length.should.equal(1);
              const roleName = users[i] === manager ? 'Manager' : 'None';
              selected[0].text().should.equal(roleName);
            }
          }));

        it('shows the .close button', () =>
          search().beforeEachResponse(component => {
            component.first('.close').should.be.visible();
          }));

        it('sends a POST request if Manager is selected', () =>
          search()
            .complete()
            .request(component => changeRole(component, 'manager'))
            .beforeEachResponse((component, config) => {
              config.method.should.equal('POST');
            })
            .respondWithSuccess());

        it('sends a DELETE request if None is re-selected', () =>
          search()
            .complete()
            .request(component => changeRole(component, 'manager'))
            .respondWithSuccess()
            .complete()
            .request(component => changeRole(component, ''))
            .beforeEachResponse((component, config) => {
              config.method.should.equal('DELETE');
            })
            .respondWithSuccess());

        testAssignmentRequest((route) => search(route)
          .complete()
          .request(component => changeRole(component, 'manager')));
      });

      describe('clearing the search', () => {
        it('does not refresh the managers if there was no change', () =>
          search()
            .complete()
            .request(component => trigger.click(component, '.close'))
            // There is a subtle assertion here: if the request callback sends a
            // request, then the number of requests will be greater than the
            // number of responses, and an error will be thrown.
            .respondWithData([/* no responses */]));

        it('shows the managers after the .close button is clicked', () =>
          search()
            .afterResponses(component => trigger.click(component, '.close'))
            .then(component => {
              component.find('tbody tr').length.should.equal(2);
            }));

        it("shows managers after user changes input to '' without clicking .close", () =>
          search()
            .afterResponses(component => changeQ(component, ''))
            .then(component => {
              component.find('tbody tr').length.should.equal(2);
            }));

        describe('refresh after manager is added and search is cleared', () => {
          const refresh = () => search()
            .complete()
            .request(component => changeRole(component, 'manager'))
            .respondWithSuccess()
            .complete()
            .request(component => trigger.click(component, '.close'))
            .respondWithData(() => [
              // test.administrators.get(0) is the current user, who is not a
              // manager.
              testData.administrators.get(1),
              testData.administrators.get(2),
              testData.administrators.get(3)
            ]);

          it('refreshes the managers successfully', refresh);

          it('disables the search button during the refresh', () =>
            refresh().beforeEachResponse(component => {
              const form = component.first('#project-user-list-search-form');
              form.first('input').getAttribute('disabled').should.be.ok();
            }));

          it('hides the .close button during the refresh', () =>
            refresh().beforeEachResponse(component => {
              component.first('.close').should.be.hidden();
            }));
        });
      });
    });
  });
});
