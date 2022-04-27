import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

const createData = () => {
  testData.extendedProjects.createPast(1, {
    name: 'My Project',
    archived: false
  });
  // We specify a name for the form in order to test that the PUT request does
  // not send it.
  testData.extendedForms.createPast(1, { name: 'My Form', state: 'closing' });
  testData.extendedFieldKeys
    .createPast(1, { displayName: 'App User 1' })
    .createPast(1, { displayName: 'App User 2' })
    .createPast(1, { displayName: 'App User 3', token: null });
  testData.standardFormSummaryAssignments
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
    // Frontend should effectively ignore the following two assignments. This
    // assignment has a valid actorId but an invalid xmlFormId.
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
    });
};

describe('ProjectFormAccess', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () => {
    testData.extendedProjects.createPast(1);
    return load('/projects/1/form-access').testRequests([
      { url: '/v1/projects/1', extended: true },
      { url: '/v1/projects/1/forms', extended: true },
      { url: '/v1/projects/1/app-users', extended: true },
      { url: '/v1/roles' },
      { url: '/v1/projects/1/assignments/forms/app-user' }
    ]);
  });

  describe('after login', () => {
    it('initially disables the Save button', async () => {
      createData();
      const app = await load('/projects/1/form-access');
      app.get('#project-form-access-save-button').element.disabled.should.be.true();
    });

    it('correctly renders the column headers of the table', async () => {
      createData();
      const app = await load('/projects/1/form-access');
      const th = app.findAll('#project-form-access-table th');
      th.map(wrapper => wrapper.text()).should.eql([
        'Form',
        'State',
        'App Users',
        'App User 2',
        'App User 1',
        ''
        // There is no column for "App User 3".
      ]);
      th[3].attributes().title.should.equal('App User 2');
      th[4].attributes().title.should.equal('App User 1');
    });

    it('shows a message if there are no forms', async () => {
      testData.extendedProjects.createPast(1);
      const component = await load('/projects/1/form-access');
      component.get('.empty-table-message').should.be.visible();
    });

    describe("changing a form's state", () => {
      beforeEach(createData);

      it('highlights the select', async () => {
        const app = await load('/projects/1/form-access');
        const select = app.get('#project-form-access-table select');
        await select.setValue('open');
        select.classes('uncommitted-change').should.be.true();
      });

      it('updates the Save button', async () => {
        const app = await load('/projects/1/form-access');
        await app.get('#project-form-access-table select').setValue('open');
        const button = app.get('#project-form-access-save-button');
        button.classes('uncommitted-change').should.be.true();
        button.element.disabled.should.be.false();
      });

      it('increments unsavedChanges', async () => {
        const app = await load('/projects/1/form-access');
        app.vm.$container.unsavedChanges.count.should.equal(0);
        await app.get('#project-form-access-table select').setValue('open');
        app.vm.$container.unsavedChanges.count.should.equal(1);
      });

      it("undoes these if the form's state is changed back", async () => {
        const app = await load('/projects/1/form-access');
        const select = app.get('#project-form-access-table select');
        await select.setValue('open');
        await select.setValue('closing');

        // Select
        select.classes('uncommitted-change').should.be.false();

        // Save button
        const button = app.get('#project-form-access-save-button');
        button.classes('uncommitted-change').should.be.false();
        button.element.disabled.should.be.true();

        // unsavedChanges
        app.vm.$container.unsavedChanges.count.should.equal(0);
      });
    });

    describe('unchecking an App User Access checkbox', () => {
      beforeEach(createData);

      it('highlights the checkbox', async () => {
        const app = await load('/projects/1/form-access');
        const checkbox = app.get('#project-form-access-table input[type="checkbox"]');
        await checkbox.setChecked(false);
        checkbox.classes('uncommitted-change').should.be.true();
      });

      it('updates the Save button', async () => {
        const app = await load('/projects/1/form-access');
        const checkbox = app.get('#project-form-access-table input[type="checkbox"]');
        await checkbox.setChecked(false);
        const button = app.get('#project-form-access-save-button');
        button.classes('uncommitted-change').should.be.true();
        button.element.disabled.should.be.false();
      });

      it('increments unsavedChanges', async () => {
        const app = await load('/projects/1/form-access');
        app.vm.$container.unsavedChanges.count.should.equal(0);
        const checkbox = app.get('#project-form-access-table input[type="checkbox"]');
        await checkbox.setChecked(false);
        app.vm.$container.unsavedChanges.count.should.equal(1);
      });

      it('undoes these if the checkbox is checked again', async () => {
        const app = await load('/projects/1/form-access');
        const checkbox = app.get('#project-form-access-table input[type="checkbox"]');
        await checkbox.setChecked(false);
        await checkbox.setChecked();

        // Checkbox
        checkbox.classes('uncommitted-change').should.be.false();

        // Save button
        const button = app.get('#project-form-access-save-button');
        button.classes('uncommitted-change').should.be.false();
        button.element.disabled.should.be.true();

        // unsavedChanges
        app.vm.$container.unsavedChanges.count.should.equal(0);
      });
    });

    describe('checking an App User Access checkbox', () => {
      beforeEach(createData);

      it('highlights the checkbox', async () => {
        const app = await load('/projects/1/form-access');
        const checkboxes = app.findAll('#project-form-access-table input[type="checkbox"]');
        checkboxes.length.should.equal(2);
        await checkboxes[1].setChecked();
        checkboxes[1].classes('uncommitted-change').should.be.true();
      });

      it('updates the Save button', async () => {
        const app = await load('/projects/1/form-access');
        const checkboxes = app.findAll('#project-form-access-table input[type="checkbox"]');
        await checkboxes[1].setChecked();
        const button = app.get('#project-form-access-save-button');
        button.classes('uncommitted-change').should.be.true();
        button.element.disabled.should.be.false();
      });
    });

    describe('saving changes', () => {
      beforeEach(createData);

      const change = async (app) => {
        const table = app.get('#project-form-access-table');
        await table.get('select').setValue('open');
        const checkboxes = table.findAll('input[type="checkbox"]');
        await checkboxes[0].setChecked(false);
        return checkboxes[1].setChecked();
      };
      const saveWithSuccess = () => load('/projects/1/form-access')
        .complete()
        .request(async (app) => {
          await change(app);
          return app.get('#project-form-access-save-button').trigger('click');
        })
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
        load('/projects/1/form-access')
          .afterResponses(change)
          .testStandardButton({
            button: '#project-form-access-save-button'
          }));

      it('sends the correct requests', () => {
        const roleId = testData.standardRoles.sorted()
          .find(role => role.system === 'app-user')
          .id;
        return saveWithSuccess().testRequests([
          {
            method: 'PUT',
            url: '/v1/projects/1',
            data: {
              name: 'My Project',
              description: '',
              archived: false,
              forms: [
                {
                  xmlFormId: 'f',
                  state: 'open',
                  // The assignment for "App User 3" is not included.
                  assignments: [{ actorId: 1, roleId }]
                }
              ]
            }
          },
          { url: '/v1/projects/1/forms', extended: true },
          { url: '/v1/projects/1/app-users', extended: true },
          { url: '/v1/projects/1/assignments/forms/app-user' }
        ]);
      });

      it('shows a success alert', () =>
        saveWithSuccess().afterResponses(app => {
          app.should.alert('success');
        }));

      it('no longer highlights Save button, select, or checkboxes', () =>
        saveWithSuccess().afterResponses(app => {
          app.find('.uncommitted-change').exists().should.be.false();
        }));

      it('disables the Save button', () =>
        saveWithSuccess().afterResponses(app => {
          app.get('#project-form-access-save-button').element.disabled.should.be.true();
        }));

      it('updates the table', () =>
        saveWithSuccess().afterResponses(app => {
          const table = app.get('#project-form-access-table');
          const th = table.findAll('th');
          th.length.should.equal(6);
          const td = table.findAll('td');
          td.length.should.equal(th.length);

          // State column
          td[1].get('select').element.value.should.equal('open');

          // App User Access columns
          th[3].text().should.equal('App User 2');
          td[3].get('input').element.checked.should.be.false();
          th[4].text().should.equal('App User 1');
          td[4].get('input').element.checked.should.be.true();
        }));

      it('updates unsavedChanges', async () => {
        const app = await saveWithSuccess();
        app.vm.$container.unsavedChanges.count.should.equal(0);
      });
    });
  });
});
