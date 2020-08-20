import ProjectFormAccess from '../../../src/components/project/form-access.vue';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRoute } from '../../util/http';
import { mountAndMark } from '../../util/lifecycle';
import { trigger } from '../../util/event';

// Loads ProjectFormAccess, rendering one row for the table.
const loadFormAccess = () => mockRoute('/projects/1/form-access')
  .respondWithData(() => testData.extendedProjects
    .createPast(1, { name: 'My Project', archived: false })
    .last())
  .respondWithData(() => testData.extendedForms
    .createPast(1, { xmlFormId: 'f', name: 'My Form', state: 'closing' })
    .sorted())
  .respondWithData(() => testData.extendedFieldKeys
    .createPast(1, { displayName: 'App User 1' })
    .createPast(1, { displayName: 'App User 2' })
    .createPast(1, { displayName: 'App User 3', token: null })
    .sorted())
  .respondWithData(() => testData.standardRoles.sorted())
  .respondWithData(() => testData.standardFormSummaryAssignments
    // Create an assignment for "App User 2", which will be the first field key
    // shown in the table.
    .createPast(1, {
      actorId: testData.extendedFieldKeys.get(1).id,
      role: 'app-user',
      xmlFormId: 'f'
    })
    .createPast(1, {
      actorId: testData.extendedFieldKeys.last().id,
      role: 'app-user',
      xmlFormId: 'f'
    })
    // Frontend should effectively ignore the following two assignments.
    // This assignment has a valid actorId but an invalid xmlFormId.
    .createPast(1, {
      actorId: testData.extendedFieldKeys.get(1).id,
      role: 'app-user',
      xmlFormId: 'does_not_exist'
    })
    // This assignment has a valid xmlFormId but an invalid actorId.
    .createPast(1, {
      actorId: 1000,
      role: 'app-user',
      xmlFormId: 'f'
    })
    .sorted());

describe('ProjectFormAccess', () => {
  beforeEach(mockLogin);

  describe('after login', () => {
    it('initially disables the Save button', () =>
      loadFormAccess().afterResponses(app => {
        app.first('#project-form-access-save-button').should.be.disabled();
      }));

    it('correctly renders the column headers of the table', () =>
      loadFormAccess().afterResponses(app => {
        const th = app.first('#project-form-access-table').find('th');
        th.map(wrapper => wrapper.text().trim().iTrim()).should.eql([
          'Form',
          'State',
          'App Users',
          'App User 2',
          'App User 1',
          ''
          // There is no column for "App User 3".
        ]);
        th[3].getAttribute('title').should.equal('App User 2');
        th[4].getAttribute('title').should.equal('App User 1');
      }));

    it('shows a message if there are no forms', () => {
      const component = mountAndMark(ProjectFormAccess, {
        propsData: {
          projectId: '1'
        },
        requestData: {
          project: testData.extendedProjects.createPast(1).last(),
          forms: [],
          fieldKeys: [],
          roles: testData.standardRoles.sorted(),
          formSummaryAssignments: []
        }
      });
      component.first('.empty-table-message').should.be.visible();
    });

    describe("changing a form's state", () => {
      it('highlights the select', () =>
        loadFormAccess()
          .afterResponses(app => {
            const select = app.first('#project-form-access-table select');
            return trigger.changeValue(select, 'open');
          })
          .then(select => {
            select.hasClass('uncommitted-change').should.be.true();
          }));

      it('updates the Save button', () =>
        loadFormAccess()
          .afterResponses(app => trigger
            .changeValue(app, '#project-form-access-table select', 'open'))
          .then(app => {
            const button = app.first('#project-form-access-save-button');
            button.hasClass('uncommitted-change').should.be.true();
            button.should.not.be.disabled();
          }));

      it("undoes these if the form's state is changed back", () =>
        loadFormAccess()
          .afterResponses(app => trigger
            .changeValue(app, '#project-form-access-table select', 'open'))
          .then(app => trigger
            .changeValue(app, '#project-form-access-table select', 'closing'))
          .then(app => {
            // Select
            const select = app.first('#project-form-access-table select');
            select.hasClass('uncommitted-change').should.be.false();

            // Save button
            const button = app.first('#project-form-access-save-button');
            button.hasClass('uncommitted-change').should.be.false();
            button.should.be.disabled();
          }));

      // Because Karma does not allow us to navigate away from the HTML page, we
      // only test navigation away within Frontend.
      it('shows a prompt if the user navigates elsewhere', () => {
        let prompted = false;
        const originalConfirm = window.confirm;
        window.confirm = () => {
          prompted = true;
          return true;
        };

        return loadFormAccess()
          .afterResponses(app => trigger
            .changeValue(app, '#project-form-access-table select', 'open'))
          .route('/projects/1')
          .then(() => {
            prompted.should.be.true();
          })
          .finally(() => {
            window.confirm = originalConfirm;
          });
      });
    });

    describe('unchecking an App User Access checkbox', () => {
      it('highlights the checkbox', () =>
        loadFormAccess()
          .afterResponses(app => {
            const table = app.first('#project-form-access-table');
            const input = table.first('input[type="checkbox"]');
            return trigger.uncheck(input);
          })
          .then(input => {
            input.hasClass('uncommitted-change').should.be.true();
          }));

      it('updates the Save button', () =>
        loadFormAccess()
          .afterResponses(app => trigger
            .uncheck(app, '#project-form-access-table input[type="checkbox"]'))
          .then(app => {
            const button = app.first('#project-form-access-save-button');
            button.hasClass('uncommitted-change').should.be.true();
            button.should.not.be.disabled();
          }));

      it('undoes these if the checkbox is checked again', () =>
        loadFormAccess()
          .afterResponses(app => trigger
            .uncheck(app, '#project-form-access-table input[type="checkbox"]'))
          .then(app => trigger
            .check(app, '#project-form-access-table input[type="checkbox"]'))
          .then(app => {
            // Input
            const table = app.first('#project-form-access-table');
            const input = table.first('input[type="checkbox"]');
            input.hasClass('uncommitted-change').should.be.false();

            // Save button
            const button = app.first('#project-form-access-save-button');
            button.hasClass('uncommitted-change').should.be.false();
            button.should.be.disabled();
          }));

      it('shows a prompt if the user navigates elsewhere', () => {
        let prompted = false;
        const originalConfirm = window.confirm;
        window.confirm = () => {
          prompted = true;
          return true;
        };

        return loadFormAccess()
          .afterResponses(app => trigger
            .uncheck(app, '#project-form-access-table input[type="checkbox"]'))
          .route('/projects/1')
          .then(() => {
            prompted.should.be.true();
          })
          .finally(() => {
            window.confirm = originalConfirm;
          });
      });
    });

    describe('checking an App User Access checkbox', () => {
      it('highlights the checkbox', () =>
        loadFormAccess()
          .afterResponses(app => {
            const table = app.first('#project-form-access-table');
            const inputs = table.find('input[type="checkbox"]');
            inputs.length.should.equal(2);
            return trigger.check(inputs[1]);
          })
          .then(input => {
            input.hasClass('uncommitted-change').should.be.true();
          }));

      it('updates the Save button', () =>
        loadFormAccess()
          .afterResponses(app => {
            const table = app.first('#project-form-access-table');
            const inputs = table.find('input[type="checkbox"]');
            return trigger.check(inputs[1])
              .then(() => {
                const button = app.first('#project-form-access-save-button');
                button.hasClass('uncommitted-change').should.be.true();
                button.should.not.be.disabled();
              });
          }));
    });

    describe('saving changes', () => {
      // Makes changes, then clicks the Save button.
      const save = () => loadFormAccess()
        .complete()
        .request(app => {
          const button = app.first('#project-form-access-save-button');
          const table = app.first('#project-form-access-table');
          const select = table.first('select');
          const inputs = table.find('input[type="checkbox"]');
          return trigger.changeValue(select, 'open')
            .then(() => trigger.uncheck(inputs[0]))
            .then(() => trigger.check(inputs[1]))
            .then(() => trigger.click(button));
        });
      // Same as save(), but also responds with data.
      const saveWithSuccess = () => save()
        .respondWithData(() => testData.standardProjects.last())
        .respondWithData(() => {
          testData.extendedForms.update(-1, { state: 'open' });
          return testData.extendedForms.sorted();
        })
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .respondWithData(() => {
          testData.standardFormSummaryAssignments.splice(0, 4);
          return testData.standardFormSummaryAssignments
            .createPast(1, {
              actorId: testData.extendedFieldKeys.first().id,
              role: 'app-user',
              xmlFormId: 'f'
            })
            .sorted();
        });

      it('implements some standard button things', () =>
        save().standardButton('#project-form-access-save-button'));

      it('sends the correct data', () =>
        saveWithSuccess().beforeEachResponse((app, config, index) => {
          if (index !== 0) return;
          const roleId = testData.standardRoles.sorted()
            .find(role => role.system === 'app-user')
            .id;
          config.data.should.eql({
            name: 'My Project',
            archived: false,
            forms: [
              {
                xmlFormId: 'f',
                name: 'My Form',
                state: 'open',
                // The assignment for "App User 3" is not included.
                assignments: [{ actorId: 1, roleId }]
              }
            ]
          });
        }));

      it('shows a success alert', () =>
        saveWithSuccess().afterResponses(app => {
          app.should.alert('success');
        }));

      it('no longer highlights Save button, select, or checkboxes', () =>
        saveWithSuccess().afterResponses(app => {
          app.find('.uncommitted-change').length.should.equal(0);
        }));

      it('disables the Save button', () =>
        saveWithSuccess().afterResponses(app => {
          app.first('#project-form-access-save-button').should.be.disabled();
        }));

      it('updates the table', () =>
        saveWithSuccess().afterResponses(app => {
          const table = app.first('#project-form-access-table');
          const th = table.find('th');
          th.length.should.equal(6);
          const td = table.find('td');
          td.length.should.equal(th.length);

          // State column
          td[1].first('select').element.value.should.equal('open');

          // App User Access columns
          th[3].text().should.equal('App User 2');
          td[3].first('input').element.checked.should.be.false();
          th[4].text().should.equal('App User 1');
          td[4].first('input').element.checked.should.be.true();
        }));

      it('does not show a prompt if the user navigates elsewhere', () => {
        let prompted = false;
        const originalConfirm = window.confirm;
        window.confirm = () => {
          prompted = true;
          return true;
        };

        return saveWithSuccess()
          .complete()
          .route('/projects/1')
          .then(() => {
            prompted.should.be.false();
          })
          .finally(() => {
            window.confirm = originalConfirm;
          });
      });
    });
  });
});
