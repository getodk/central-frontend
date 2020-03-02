import ProjectUserList from '../../../../src/components/project/user/list.vue';
import Spinner from '../../../../src/components/spinner.vue';
import testData from '../../../data';
import { mockHttp, mockRoute } from '../../../util/http';
import { mockLogin } from '../../../util/session';
import { trigger } from '../../../util/event';

// Creates a project, users, and project assignments, then loads the component.
// Use `roles` to specify a role for every user; a user will be created for each
// element of the array.
const load = ({ roles, route = false }) => {
  // Create the users.
  mockLogin({ displayName: 'User 1' });
  roles.length.should.not.equal(0);
  for (let i = 1; i < roles.length; i += 1)
    testData.extendedUsers.createPast(1, { displayName: `User ${i + 1}` });

  // Create the project.
  testData.extendedProjects.size.should.equal(0);
  testData.extendedProjects.createPast(1, { role: roles[0] });

  // Create the assignments.
  for (let i = 0; i < roles.length; i += 1) {
    if (roles[i] !== 'none') {
      testData.extendedProjectAssignments.createPast(1, {
        actor: testData.extendedUsers.get(i),
        role: roles[i]
      });
    }
  }

  if (route) {
    return mockRoute('/projects/1/users')
      .respondWithData(() => testData.extendedProjects.last())
      .respondWithData(() => testData.standardRoles.sorted())
      .respondWithData(() => testData.extendedProjectAssignments.sorted());
  }
  return mockHttp()
    .mount(ProjectUserList, {
      propsData: { projectId: '1' },
      requestData: { project: testData.extendedProjects.last() }
    })
    .respondWithData(() => testData.standardRoles.sorted())
    .respondWithData(() => testData.extendedProjectAssignments.sorted());
};
const changeQ = (component, q) =>
  trigger.changeValue(component, '#project-user-list-search-form input', q);
// Changes the role select element of the first row of the table.
const changeRole = (component, systemOrNone) => {
  const role = systemOrNone !== 'none'
    ? testData.standardRoles.sorted().find(r => r.system === systemOrNone)
    : null;
  if (systemOrNone !== 'none' && role == null)
    throw new Error('role not found');
  return trigger.changeValue(
    component,
    '#project-user-list select',
    role != null ? role.id.toString() : ''
  );
};
// Loads two assignments, then submits a search that returns four users, one of
// whom has an assignment.
const search = (route = undefined) => load({
  roles: ['none', 'viewer', 'manager', 'none', 'none', 'none'],
  route
})
  .complete()
  .request(component => changeQ(component, 'some search term'))
  .respondWithData(() => [
    // For the first element, we choose a user without an assignment in order to
    // facilitate the use of changeRole(). Otherwise, the order of the search
    // results should not matter and might not match what Backend would actually
    // return.
    testData.standardUsers.get(3),
    testData.standardUsers.get(4),
    testData.standardUsers.get(5),
    testData.standardUsers.get(1)
  ]);

describe('ProjectUserList', () => {
  describe('behavior of the component before any role change', () => {
    it('does not send a new request if user navigates back to tab', () => {
      mockLogin();
      return mockRoute('/projects/1/users')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.standardRoles.sorted())
        .respondWithData(() => testData.extendedProjectAssignments.sorted())
        .complete()
        .route('/projects/1/settings')
        .complete()
        .route('/projects/1/users')
        .testNoRequest();
    });

    describe('before the initial data is received', () => {
      it('disables the search input', () =>
        load({ roles: ['none'] }).beforeEachResponse(component => {
          const input = component.first('#project-user-list-search-form input');
          input.should.be.disabled();
        }));

      it('hides the .close button', () =>
        load({ roles: ['none'] }).beforeEachResponse(component => {
          component.first('.close').should.be.hidden();
        }));
    });

    describe('search label', () => {
      it('shows a particular label if the user can user.list', () => {
        mockLogin();
        return mockRoute('/projects/1/users')
          .respondWithData(() => testData.extendedProjects.createPast(1).last())
          .respondWithData(() => testData.standardRoles.sorted())
          .respondWithData(() => testData.extendedProjectAssignments.sorted())
          .afterResponses(app => {
            const form = app.first('#project-user-list-search-form');
            const placeholder = form.first('input').getAttribute('placeholder');
            placeholder.should.equal('Search for a user…');
            const label = form.first('.form-label').text();
            label.should.equal('Search for a user…');
          });
      });

      it('shows a particular label if the user cannot user.list', () => {
        mockLogin({ role: 'none' });
        return mockRoute('/projects/1/users')
          .respondWithData(() =>
            testData.extendedProjects.createPast(1, { role: 'manager' }).last())
          .respondWithData(() => testData.standardRoles.sorted())
          .respondWithData(() => testData.extendedProjectAssignments.sorted())
          .afterResponses(app => {
            const form = app.first('#project-user-list-search-form');
            const placeholder = form.first('input').getAttribute('placeholder');
            placeholder.should.equal('Enter exact user email address…');
            const label = form.first('.form-label').text();
            label.should.equal('Enter exact user email address…');
          });
      });
    });

    it('shows the table data', () =>
      load({ roles: ['none', 'viewer', 'manager'] })
        .afterResponses(component => {
          const tr = component.find('tbody tr');
          tr.length.should.equal(2);

          tr[0].first('td').text().should.equal('User 2');
          const standardRoles = testData.standardRoles.sorted();
          tr[0].first('select').element.value.should.equal(
            standardRoles.find(role => role.system === 'viewer').id.toString()
          );

          tr[1].first('td').text().should.equal('User 3');
          tr[1].first('select').element.value.should.equal(
            standardRoles.find(role => role.system === 'manager').id.toString()
          );
        }));

    it('renders the select correctly for the current user', () =>
      load({ roles: ['manager', 'manager'] }).afterResponses(component => {
        const tr = component.find('tbody tr');
        tr.length.should.equal(2);
        const selects = tr.map(wrapper => wrapper.first('select'));

        tr[0].first('td').text().should.equal('User 1');
        selects[0].should.be.disabled();
        selects[0].element.title.should.equal('You may not edit your own Project Role.');

        selects[1].should.not.be.disabled();
        selects[1].element.title.should.equal('');
      }));

    describe('no assignments', () => {
      it('shows the table headers and a message', () =>
        load({ roles: ['none'] }).afterResponses(component => {
          component.find('thead tr').length.should.equal(1);

          const message = component.first('.empty-table-message');
          message.should.be.visible();
          message.text().trim().should.startWith('There are no users');
        }));

      it('shows the message again after a search is cleared', () =>
        load({ roles: ['none'] })
          .complete()
          .request(component => changeQ(component, 'some search term'))
          .respondWithData(() => testData.standardUsers.sorted())
          .afterResponse(component => {
            component.first('.empty-table-message').should.be.hidden();
          })
          .request(component => trigger.click(component, '.close'))
          .respondWithData(() => testData.extendedProjectAssignments.sorted())
          .afterResponse(component => {
            component.first('.empty-table-message').should.be.visible();
          }));
    });
  });

  describe('changing a role without searching', () => {
    describe('request verbs', () => {
      it('sends a single DELETE request after a change from Manager to None', () =>
        load({ roles: ['none', 'manager'] })
          .complete()
          .request(component => changeRole(component, 'none'))
          .beforeEachResponse((component, config) => {
            config.method.should.equal('DELETE');
          })
          .respondWithSuccess());

      it('sends a single POST request if Manager is then re-selected', () =>
        load({ roles: ['none', 'manager'] })
          .complete()
          .request(component => changeRole(component, 'none'))
          .respondWithSuccess()
          .complete()
          .request(component => changeRole(component, 'manager'))
          .beforeEachResponse((component, config) => {
            config.method.should.equal('POST');
          })
          .respondWithSuccess());

      it('sends two requests after a change from Manager to Viewer', () =>
        load({ roles: ['none', 'manager'] })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .beforeEachResponse((component, config, index) => {
            config.method.should.equal(index === 0 ? 'DELETE' : 'POST');
          })
          .respondWithSuccess()
          .respondWithSuccess());
    });

    describe('during the request', () => {
      it('disables the select', () =>
        load({ roles: ['none', 'manager'] })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .beforeEachResponse(component => {
            component.first('select').should.be.disabled();
          })
          .respondWithSuccess()
          .respondWithSuccess());

      it('shows a spinner', () =>
        load({ roles: ['none', 'manager'] })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .beforeEachResponse(component => {
            component.first(Spinner).getProp('state').should.be.true();
          })
          .respondWithSuccess()
          .respondWithSuccess());

      it('disables the search input', () =>
        load({ roles: ['none', 'manager'] })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .beforeEachResponse(component => {
            const form = component.first('#project-user-list-search-form');
            form.first('input').should.be.disabled();
          })
          .respondWithSuccess()
          .respondWithSuccess());

      it('hides the .close button', () =>
        load({ roles: ['none', 'manager'] })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .beforeEachResponse(component => {
            component.first('.close').should.be.hidden();
          })
          .respondWithSuccess()
          .respondWithSuccess());
    });

    describe('after a successful change', () => {
      it('shows a success alert', () =>
        load({ roles: ['none', 'manager'], route: true })
          .complete()
          .request(app => changeRole(app, 'viewer'))
          .respondWithSuccess()
          .respondWithSuccess()
          .afterResponses(app => {
            app.should.alert('success');
          }));

      it('shows the new role in the table', () =>
        load({ roles: ['none', 'manager'] })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .respondWithSuccess()
          .respondWithSuccess()
          .afterResponses(component => {
            const standardRoles = testData.standardRoles.sorted();
            component.first('select').element.value.should.equal(
              standardRoles.find(role => role.system === 'viewer').id.toString()
            );
          }));

      it('remembers change from Manager to Viewer if user navigates away', () =>
        load({ roles: ['none', 'manager'], route: true })
          .complete()
          .request(app => changeRole(app, 'viewer'))
          .respondWithSuccess()
          .respondWithSuccess()
          .complete()
          .route('/projects/1/settings')
          .complete()
          .route('/projects/1/users')
          .then(app => {
            const standardRoles = testData.standardRoles.sorted();
            app.first('#project-user-list select').element.value.should.equal(
              standardRoles.find(role => role.system === 'viewer').id.toString()
            );
          }));
    });

    describe('after the second request fails', () => {
      it('shows a danger alert', () =>
        load({ roles: ['none', 'manager'], route: true })
          .complete()
          .request(app => changeRole(app, 'viewer'))
          .respondWithSuccess()
          .respondWithProblem()
          .afterResponses(app => {
            app.should.alert(
              'danger',
              'Something went wrong. "User 2" has been removed from the Project.'
            );
          }));

      it('shows that the user has no role', () =>
        load({ roles: ['none', 'manager'] })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .respondWithSuccess()
          .respondWithProblem()
          .afterResponses(component => {
            component.first('select').element.value.should.equal('');
          }));
    });
  });

  describe('during a search request', () => {
    it('hides the assignments', () =>
      search().beforeAnyResponse(component => {
        component.find('tbody tr').length.should.equal(0);
      }));

    it('does not disable the search input', () =>
      search().beforeAnyResponse(component => {
        const form = component.first('#project-user-list-search-form');
        form.first('input').should.not.be.disabled();
      }));

    it('shows the .close button', () =>
      search().beforeAnyResponse(component => {
        component.first('.close').should.be.visible();
      }));

    it('allows another search, canceling the first search', () =>
      search()
        // Sends a request for a second search.
        .beforeAnyResponse(component =>
          changeQ(component, 'some other search term'))
        // search() specifies the response to the first search: this is the
        // response to the second search.
        .respondWithData(() => [testData.standardUsers.last()])
        .afterResponses(component => {
          component.find('tbody tr').length.should.equal(1);
        }));
  });

  describe('search results', () => {
    it('shows a message if there are no search results', () =>
      load({ roles: ['none', 'manager'] })
        .complete()
        .request(component => changeQ(component, 'some search term'))
        .respondWithData(() => [])
        .afterResponse(component => {
          const message = component.first('.empty-table-message');
          message.should.be.visible();
          message.text().trim().should.equal('No results');
        }));

    it('shows the search results', () =>
      search().afterResponse(component => {
        const tr = component.find('tbody tr');
        tr.length.should.equal(4);

        tr[0].first('td').text().should.equal('User 4');
        tr[0].first('select').element.value.should.equal('');

        tr[1].first('td').text().should.equal('User 5');
        tr[1].first('select').element.value.should.equal('');

        tr[2].first('td').text().should.equal('User 6');
        tr[2].first('select').element.value.should.equal('');

        tr[3].first('td').text().should.equal('User 2');
        const standardRoles = testData.standardRoles.sorted();
        tr[3].first('select').element.value.should.equal(
          standardRoles.find(role => role.system === 'viewer').id.toString()
        );
      }));

    it('shows the .close button', () =>
      search().afterResponse(component => {
        component.first('.close').should.be.visible();
      }));
  });

  describe('changing a role after search', () => {
    describe('request verbs', () => {
      it('sends a single POST request after a change from None to Manager', () =>
        search()
          .complete()
          .request(component => changeRole(component, 'manager'))
          .beforeEachResponse((component, config) => {
            config.method.should.equal('POST');
          })
          .respondWithSuccess());

      it('sends a single DELETE request if None is then re-selected', () =>
        search()
          .complete()
          .request(component => changeRole(component, 'manager'))
          .respondWithSuccess()
          .complete()
          .request(component => changeRole(component, 'none'))
          .beforeEachResponse((component, config) => {
            config.method.should.equal('DELETE');
          })
          .respondWithSuccess());
    });

    it('remembers change from None to Manager if user navigates away', () =>
      search(true)
        .complete()
        .request(app => changeRole(app, 'manager'))
        .respondWithSuccess()
        .complete()
        .route('/projects/1/settings')
        .complete()
        .route('/projects/1/users')
        .then(app => {
          app.find('#project-user-list tbody tr').length.should.equal(3);
        }));
  });

  describe('clearing the search', () => {
    const giveRoleThenClearSearch = (clickClose = true) => search()
      .complete()
      .request(component => changeRole(component, 'manager'))
      .respondWithSuccess()
      .complete()
      .request(component => (clickClose
        ? trigger.click(component, '.close')
        : changeQ(component, '')))
      .respondWithData(() => testData.extendedProjectAssignments
        .createPast(1, {
          actor: testData.extendedUsers.get(3),
          role: 'manager'
        })
        .sorted());

    it('disables the search input during the request', () =>
      giveRoleThenClearSearch().beforeAnyResponse(component => {
        const form = component.first('#project-user-list-search-form');
        form.first('input').should.be.disabled();
      }));

    it('hides the .close button during the request', () =>
      giveRoleThenClearSearch().beforeAnyResponse(component => {
        component.first('.close').should.be.hidden();
      }));

    it('shows the assignments after the .close button is clicked', () =>
      giveRoleThenClearSearch(true).afterResponse(component => {
        component.find('tbody tr').length.should.equal(3);
      }));

    it("shows assignments after user changes input to '' without clicking .close", () =>
      giveRoleThenClearSearch(false).afterResponse(component => {
        component.find('tbody tr').length.should.equal(3);
      }));
  });
});
