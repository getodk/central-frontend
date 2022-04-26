import Spinner from '../../../../src/components/spinner.vue';

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';

// Creates a project, users, and project assignments. Use `roles` to specify a
// role for every user; a user will be created for each element of the array.
const createData = (roles) => {
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
};
const changeQ = (component, q) => {
  const input = component.get('#project-user-list-search-form input');
  input.element.value = q;
  return input.trigger('change');
};
// Changes the role select element of the first row of the table.
const changeRole = (component, systemOrNone) => {
  const role = systemOrNone !== 'none'
    ? testData.standardRoles.sorted().find(r => r.system === systemOrNone)
    : null;
  if (systemOrNone !== 'none' && role == null)
    throw new Error('role not found');
  const select = component.get('#project-user-list select');
  return select.setValue(role != null ? role.id.toString() : '');
};
// Loads two assignments, then submits a search that returns four users, one of
// whom has an assignment.
const search = (mountOptions = {}) => {
  createData(['none', 'viewer', 'manager', 'none', 'none', 'none']);
  return load('/projects/1/users', mountOptions)
    .complete()
    .request(component => changeQ(component, 'some search term'))
    .respondWithData(() => [
      // For the first element, we choose a user without an assignment in order to
      // to facilitate the use of changeRole(). Otherwise, the order of the
      // search results should not matter and might not match what Backend would
      // actually return.
      testData.standardUsers.get(3),
      testData.standardUsers.get(4),
      testData.standardUsers.get(5),
      testData.standardUsers.get(1)
    ]);
};

describe('ProjectUserList', () => {
  it('sends the correct initial requests', () => {
    mockLogin();
    testData.extendedProjects.createPast(1);
    return load('/projects/1/users', { root: false }).testRequests([
      { url: '/v1/roles' },
      { url: '/v1/projects/1/assignments', extended: true }
    ]);
  });

  describe('behavior of the component before any role change', () => {
    describe('before the initial data is received', () => {
      it('disables the search input', () => {
        createData(['none']);
        return load('/projects/1/users', { root: false })
          .beforeEachResponse(component => {
            const input = component.get('#project-user-list-search-form input');
            input.element.disabled.should.be.true();
          });
      });

      it('hides the .close button', () => {
        createData(['none']);
        return load('/projects/1/users', { root: false })
          .beforeEachResponse(component => {
            component.get('.close').should.be.hidden();
          });
      });
    });

    describe('search label', () => {
      it('shows a particular label if the user can user.list', () => {
        mockLogin();
        testData.extendedProjects.createPast(1);
        return load('/projects/1/users').then(app => {
          const form = app.get('#project-user-list-search-form');
          const { placeholder } = form.get('input').attributes();
          placeholder.should.equal('Search for a user…');
          const label = form.get('.form-label').text();
          label.should.equal('Search for a user…');
        });
      });

      it('shows a particular label if the user cannot user.list', () => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'manager' });
        return load('/projects/1/users').then(app => {
          const form = app.get('#project-user-list-search-form');
          const { placeholder } = form.get('input').attributes();
          placeholder.should.equal('Enter exact user email address…');
          const label = form.get('.form-label').text();
          label.should.equal('Enter exact user email address…');
        });
      });
    });

    it('shows the correct options for the select', () => {
      createData(['manager']);
      return load('/projects/1/users').then(app => {
        const options = app.findAll('#project-user-list tbody tr option');
        options.map(option => option.text()).should.eql([
          'Project Manager',
          'Project Viewer',
          'Data Collector',
          'None'
        ]);
        const standardRoles = testData.standardRoles.sorted();
        options[0].attributes().value.should.equal(
          standardRoles.find(role => role.system === 'manager').id.toString()
        );
        options[options.length - 1].attributes().value.should.equal('');
      });
    });

    it('shows the table data', () => {
      createData(['none', 'viewer', 'manager']);
      return load('/projects/1/users', { root: false })
        .afterResponses(component => {
          const tr = component.findAll('tbody tr');
          tr.length.should.equal(2);

          tr[0].get('td').text().should.equal('User 2');
          const standardRoles = testData.standardRoles.sorted();
          tr[0].get('select').element.value.should.equal(
            standardRoles.find(role => role.system === 'viewer').id.toString()
          );

          tr[1].get('td').text().should.equal('User 3');
          tr[1].get('select').element.value.should.equal(
            standardRoles.find(role => role.system === 'manager').id.toString()
          );
        });
    });

    it('renders the select correctly for the current user', () => {
      createData(['manager', 'manager']);
      return load('/projects/1/users', { root: false }).afterResponses(component => {
        const tr = component.findAll('tbody tr');
        tr.length.should.equal(2);
        const selects = tr.map(wrapper => wrapper.get('select'));

        tr[0].get('td').text().should.equal('User 1');
        selects[0].element.disabled.should.be.true();
        selects[0].attributes().title.should.equal('You may not edit your own Project Role.');

        selects[1].element.disabled.should.be.false();
        should.not.exist(selects[1].attributes().title);
      });
    });

    describe('no assignments', () => {
      it('shows the table headers and a message', () => {
        createData(['none']);
        return load('/projects/1/users', { root: false }).afterResponses(component => {
          component.findAll('thead tr').length.should.equal(1);

          const message = component.get('.empty-table-message');
          message.should.be.visible();
          message.text().should.startWith('There are no users');
        });
      });

      it('shows the message again after a search is cleared', () => {
        createData(['none']);
        return load('/projects/1/users', { root: false })
          .complete()
          .request(component => changeQ(component, 'some search term'))
          .respondWithData(() => testData.standardUsers.sorted())
          .afterResponse(component => {
            component.get('.empty-table-message').should.be.hidden();
          })
          .request(component => component.get('.close').trigger('click'))
          .respondWithData(() => testData.extendedProjectAssignments.sorted())
          .afterResponse(component => {
            component.get('.empty-table-message').should.be.visible();
          });
      });
    });
  });

  describe('changing a role without searching', () => {
    describe('request verbs', () => {
      it('sends a single DELETE request after a change from Manager to None', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users', { root: false })
          .complete()
          .request(component => changeRole(component, 'none'))
          .beforeEachResponse((component, config) => {
            config.method.should.equal('DELETE');
          })
          .respondWithSuccess();
      });

      it('sends a single POST request if Manager is then re-selected', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users', { root: false })
          .complete()
          .request(component => changeRole(component, 'none'))
          .respondWithSuccess()
          .complete()
          .request(component => changeRole(component, 'manager'))
          .beforeEachResponse((component, config) => {
            config.method.should.equal('POST');
          })
          .respondWithSuccess();
      });

      it('sends two requests after a change from Manager to Viewer', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users', { root: false })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .beforeEachResponse((component, config, index) => {
            config.method.should.equal(index === 0 ? 'DELETE' : 'POST');
          })
          .respondWithSuccess()
          .respondWithSuccess();
      });
    });

    describe('during the request', () => {
      it('disables the select', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users', { root: false })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .beforeEachResponse(component => {
            component.get('select').element.disabled.should.be.true();
          })
          .respondWithSuccess()
          .respondWithSuccess();
      });

      it('shows a spinner', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users', { root: false })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .beforeEachResponse(component => {
            component.getComponent(Spinner).props().state.should.be.true();
          })
          .respondWithSuccess()
          .respondWithSuccess();
      });

      it('disables the search input', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users', { root: false })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .beforeEachResponse(component => {
            const input = component.get('#project-user-list-search-form input');
            input.element.disabled.should.be.true();
          })
          .respondWithSuccess()
          .respondWithSuccess();
      });

      it('hides the .close button', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users', { root: false })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .beforeEachResponse(component => {
            component.get('.close').should.be.hidden();
          })
          .respondWithSuccess()
          .respondWithSuccess();
      });
    });

    describe('after a successful change', () => {
      it('shows a success alert', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users')
          .complete()
          .request(app => changeRole(app, 'viewer'))
          .respondWithSuccess()
          .respondWithSuccess()
          .afterResponses(app => {
            app.should.alert('success');
          });
      });

      it('shows the new role in the table', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users', { root: false })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .respondWithSuccess()
          .respondWithSuccess()
          .afterResponses(component => {
            const standardRoles = testData.standardRoles.sorted();
            component.get('select').element.value.should.equal(
              standardRoles.find(role => role.system === 'viewer').id.toString()
            );
          });
      });

      it('remembers change from Manager to Viewer if user navigates away', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users')
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
            app.get('#project-user-list select').element.value.should.equal(
              standardRoles.find(role => role.system === 'viewer').id.toString()
            );
          });
      });
    });

    describe('after the second request fails', () => {
      it('shows a danger alert', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users')
          .complete()
          .request(app => changeRole(app, 'viewer'))
          .respondWithSuccess()
          .respondWithProblem()
          .afterResponses(app => {
            app.should.alert(
              'danger',
              'Something went wrong. “User 2” has been removed from the Project.'
            );
          });
      });

      it('shows that the user has no role', () => {
        createData(['none', 'manager']);
        return load('/projects/1/users', { root: false })
          .complete()
          .request(component => changeRole(component, 'viewer'))
          .respondWithSuccess()
          .respondWithProblem()
          .afterResponses(component => {
            component.get('select').element.value.should.equal('');
          });
      });
    });
  });

  describe('during a search request', () => {
    it('hides the assignments', () =>
      search({ root: false }).beforeAnyResponse(component => {
        component.find('tbody tr').exists().should.be.false();
      }));

    it('does not disable the search input', () =>
      search({ root: false }).beforeAnyResponse(component => {
        const input = component.get('#project-user-list-search-form input');
        input.element.disabled.should.be.false();
      }));

    it('shows the .close button', () =>
      search({ root: false }).beforeAnyResponse(component => {
        component.get('.close').should.be.visible();
      }));

    it('allows another search, canceling the first search', () =>
      search({ root: false })
        // Sends a request for a second search.
        .beforeAnyResponse(component =>
          changeQ(component, 'some other search term'))
        // search() specifies the response to the first search: this is the
        // response to the second search.
        .respondWithData(() => [testData.standardUsers.last()])
        .afterResponses(component => {
          component.findAll('tbody tr').length.should.equal(1);
        }));
  });

  describe('search results', () => {
    it('shows a message if there are no search results', () => {
      createData(['none', 'manager']);
      return load('/projects/1/users', { root: false })
        .complete()
        .request(component => changeQ(component, 'some search term'))
        .respondWithData(() => [])
        .afterResponse(component => {
          const message = component.get('.empty-table-message');
          message.should.be.visible();
          message.text().should.equal('No results');
        });
    });

    it('shows the search results', () =>
      search({ root: false }).afterResponse(component => {
        const tr = component.findAll('tbody tr');
        tr.length.should.equal(4);

        tr[0].get('td').text().should.equal('User 4');
        tr[0].get('select').element.value.should.equal('');

        tr[1].get('td').text().should.equal('User 5');
        tr[1].get('select').element.value.should.equal('');

        tr[2].get('td').text().should.equal('User 6');
        tr[2].get('select').element.value.should.equal('');

        tr[3].get('td').text().should.equal('User 2');
        const standardRoles = testData.standardRoles.sorted();
        tr[3].get('select').element.value.should.equal(
          standardRoles.find(role => role.system === 'viewer').id.toString()
        );
      }));

    it('shows the .close button', () =>
      search({ root: false }).afterResponse(component => {
        component.get('.close').should.be.visible();
      }));
  });

  describe('changing a role after search', () => {
    describe('request verbs', () => {
      it('sends a single POST request after a change from None to Manager', () =>
        search({ root: false })
          .complete()
          .request(component => changeRole(component, 'manager'))
          .beforeEachResponse((component, config) => {
            config.method.should.equal('POST');
          })
          .respondWithSuccess());

      it('sends a single DELETE request if None is then re-selected', () =>
        search({ root: false })
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
      search()
        .complete()
        .request(app => changeRole(app, 'manager'))
        .respondWithSuccess()
        .complete()
        .route('/projects/1/settings')
        .complete()
        .route('/projects/1/users')
        .then(app => {
          app.findAll('#project-user-list tbody tr').length.should.equal(3);
        }));
  });

  describe('clearing the search', () => {
    const giveRoleThenClearSearch = (clickClose = true) => search({ root: false })
      .complete()
      .request(component => changeRole(component, 'manager'))
      .respondWithSuccess()
      .complete()
      .request(component => (clickClose
        ? component.get('.close').trigger('click')
        : changeQ(component, '')))
      .respondWithData(() => testData.extendedProjectAssignments
        .createPast(1, {
          actor: testData.extendedUsers.get(3),
          role: 'manager'
        })
        .sorted());

    it('disables the search input during the request', () =>
      giveRoleThenClearSearch().beforeAnyResponse(component => {
        const input = component.get('#project-user-list-search-form input');
        input.element.disabled.should.be.true();
      }));

    it('hides the .close button during the request', () =>
      giveRoleThenClearSearch().beforeAnyResponse(component => {
        component.get('.close').should.be.hidden();
      }));

    it('shows the assignments after the .close button is clicked', () =>
      giveRoleThenClearSearch(true).afterResponse(component => {
        component.findAll('tbody tr').length.should.equal(3);
      }));

    it("shows assignments after user changes input to '' without clicking .close", () =>
      giveRoleThenClearSearch(false).afterResponse(component => {
        component.findAll('tbody tr').length.should.equal(3);
      }));
  });
});
