import FormTable from '../../../src/components/form/table.vue';
import FormRow from '../../../src/components/form/row.vue';

import { ago } from '../../../src/util/date-time';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormList', () => {
  describe('create button', () => {
    it('shows the button to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedProjects.createPast(1);
      const app = await load('/projects/1');
      app.get('#form-list-create-button').should.be.visible();
    });

    it('does not render the button for a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer' });
      const app = await load('/projects/1', {}, { deletedForms: false });
      app.find('#form-list-create-button').exists().should.be.false();
    });
  });

  it('shows a message if there are no forms', async () => {
    mockLogin();
    testData.extendedProjects.createPast(1);
    const app = await load('/projects/1');
    app.get('#form-list .empty-table-message').should.be.visible();
  });

  describe('regular and closed form tables', () => {
    beforeEach(mockLogin);

    it('shows both tables of forms', async () => {
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { state: 'open' });
      testData.extendedForms.createPast(1, { state: 'closed' });
      testData.extendedForms.createPast(1, { state: 'closing' });
      const app = await load('/projects/1');
      const tables = app.findAllComponents(FormTable);
      tables.length.should.equal(2);
      tables[0].props().showClosed.should.be.false();
      tables[1].props().showClosed.should.be.true();
      tables[0].findAllComponents(FormRow).length.should.equal(2);
      tables[1].findAllComponents(FormRow).length.should.equal(1);
    });

    it('does not render table for closed forms if none exist', async () => {
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { state: 'open' });
      testData.extendedForms.createPast(1, { state: 'open' });
      const app = await load('/projects/1');
      const closedTable = app.findAllComponents(FormTable)[1];
      closedTable.find('*').exists().should.be.false();
    });
  });

  describe('sorting', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { name: 'A', state: 'open' });
      testData.extendedForms.createPast(1, { name: 'B', state: 'closing' });
      testData.extendedForms.createPast(1, {
        name: 'C',
        state: 'open',
        lastSubmission: ago({ days: 10 }).toISO()
      });
      testData.extendedForms.createPast(1, {
        name: 'X',
        state: 'closed',
        lastSubmission: ago({ days: 20 }).toISO()
      });
      testData.extendedForms.createPast(1, {
        name: 'Y',
        state: 'closed',
        lastSubmission: ago({ days: 10 }).toISO()
      });
      testData.extendedForms.createPast(1, {
        name: 'Z',
        state: 'closed',
        lastSubmission: ago({ days: 15 }).toISO()
      });
    });

    it('sorts by alphabetical by default', async () => {
      const app = await load('/projects/1');
      const tables = app.findAllComponents(FormTable);
      const forms = tables[0].findAllComponents(FormRow);
      const closedForms = tables[1].findAllComponents(FormRow);
      forms.length.should.equal(3);
      closedForms.length.should.equal(3);
      forms.map((row) => row.props().form.name).should.eql(['A', 'B', 'C']);
      closedForms.map((row) => row.props().form.name).should.eql(['X', 'Y', 'Z']);
    });

    it('changes sort to newest', async () => {
      const app = await load('/projects/1');
      await app.find('#form-sort select').setValue('newest');
      const tables = app.findAllComponents(FormTable);
      const forms = tables[0].findAllComponents(FormRow);
      const closedForms = tables[1].findAllComponents(FormRow);
      forms.length.should.equal(3);
      closedForms.length.should.equal(3);
      forms.map((row) => row.props().form.name).should.eql(['C', 'B', 'A']);
      closedForms.map((row) => row.props().form.name).should.eql(['Z', 'Y', 'X']);
    });

    it('changes sort to latest submission with alphabetical tie break', async () => {
      const app = await load('/projects/1');
      await app.find('#form-sort select').setValue('latest');
      const tables = app.findAllComponents(FormTable);
      const forms = tables[0].findAllComponents(FormRow);
      const closedForms = tables[1].findAllComponents(FormRow);
      forms.length.should.equal(3);
      closedForms.length.should.equal(3);
      forms.map((row) => row.props().form.name).should.eql(['C', 'A', 'B']);
      closedForms.map((row) => row.props().form.name).should.eql(['Y', 'Z', 'X']);
    });
  });
});
