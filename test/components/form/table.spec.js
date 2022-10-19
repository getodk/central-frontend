import FormTable from '../../../src/components/form/table.vue';
import FormRow from '../../../src/components/form/row.vue';

import useProject from '../../../src/request-data/project';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = (showClosed = false) => mount(FormTable, {
  props: {
    showClosed,
    // This is a placeholder sort function. The real one will be
    // passed through from forms/list.vue
    sortFunc: (a, b) => a.xmlFormId.localeCompare(b.xmlFormId)
  },
  container: {
    requestData: testRequestData([useProject], {
      forms: testData.extendedForms.sorted(),
      project: testData.extendedProjects.last()
    }),
    router: mockRouter('/projects/1')
  }
});

describe('FormTable', () => {
  describe('number of columns', () => {
    it('shows all columns to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedForms.createPast(1, { state: 'open' });
      const app = await load('/projects/1');
      const table = app.getComponent(FormTable);
      const headers = table.findAll('th').map(th => th.text());
      headers.should.eql(['Name', 'Review States', 'Latest', 'Total', 'Actions']);
      table.findAll('td').length.should.equal(7);
    });

    it('shows the correct columns to a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1, { state: 'open' });
      const app = await load('/projects/1', {}, { deletedForms: false });
      const table = app.getComponent(FormTable);
      const headers = table.findAll('th').map(th => th.text());
      headers.should.eql(['Name', 'Review States', 'Latest', 'Total']);
      const td = table.findAll('td');
      td.length.should.equal(6);
      td[5].classes('total-submissions').should.be.true();
    });

    it('shows the correct columns to a Data Collector', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
      testData.extendedForms.createPast(1, { state: 'open' });
      const app = await load('/projects/1', {}, { deletedForms: false });
      const table = app.getComponent(FormTable);
      const headers = table.findAll('th').map(th => th.text());
      headers.should.eql(['Name', 'Review States', 'Latest', 'Total', 'Actions']);
      const td = table.findAll('td');
      td.length.should.equal(7);
      td[6].classes('actions').should.be.true();
    });
  });

  describe('number of rows', () => {
    it('shows a form without a published version to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedProjects.createPast(1, { forms: 2 });
      testData.extendedForms.createPast(1, { name: 'My Published Form', state: 'open' });
      testData.extendedForms.createPast(1, {
        name: 'My Draft Form',
        draft: true,
        state: 'open'
      });
      const app = await load('/projects/1');
      const text = app.findAll('.form-row .name').map(td => td.text());
      text.should.eql(['My Draft Form', 'My Published Form']);
    });

    it('does not show a form without a published version to a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 2 });
      testData.extendedForms.createPast(1, { name: 'My Published Form', state: 'open' });
      testData.extendedForms.createPast(1, {
        name: 'My Draft Form',
        draft: true,
        state: 'open'
      });
      const app = await load('/projects/1', {}, { deletedForms: false });
      const text = app.findAll('.form-row .name').map(td => td.text());
      text.should.eql(['My Published Form']);
    });

    it('does not show form without published version to Data Collector', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'formfill', forms: 2 });
      testData.extendedForms.createPast(1, { name: 'My Published Form', state: 'open' });
      testData.extendedForms.createPast(1, {
        name: 'My Draft Form',
        draft: true,
        state: 'open'
      });
      const app = await load('/projects/1', {}, { deletedForms: false });
      const text = app.findAll('.form-row .name').map(td => td.text());
      text.should.eql(['My Published Form']);
    });
  });

  describe('sorting', () => {
    it('applies sorting to forms in table', () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { name: 'aaa_z', xmlFormId: 'z', state: 'open' });
      testData.extendedForms.createPast(1, { name: 'bbb_y', xmlFormId: 'y', state: 'open' });
      testData.extendedForms.createPast(1, { name: 'ccc_w', xmlFormId: 'w', state: 'open' });
      testData.extendedForms.createPast(1, { name: 'ddd_x', xmlFormId: 'x', state: 'open' });
      const table = mountComponent();
      const rows = table.findAllComponents(FormRow);
      // Test component's sort function defined above will sort by xmlFormId
      rows.map((row) => row.props().form.name).should.eql(['ccc_w', 'ddd_x', 'bbb_y', 'aaa_z']);
    });
  });

  describe('closed vs. non-closed table', () => {
    it('filters out closed forms if showClosed is false', () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { name: 'a_open', xmlFormId: 'a', state: 'open' });
      testData.extendedForms.createPast(1, { name: 'b_closed', xmlFormId: 'b', state: 'closed' });
      testData.extendedForms.createPast(1, { name: 'c_closing', xmlFormId: 'c', state: 'closing' });
      const rows = mountComponent().findAllComponents(FormRow);
      rows.length.should.equal(2);
      rows.map((row) => row.props().form.name).should.eql(['a_open', 'c_closing']);
    });

    it('filters out non-closed forms if showClosed is true', () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { name: 'a_open', xmlFormId: 'a', state: 'open' });
      testData.extendedForms.createPast(1, { name: 'b_closed', xmlFormId: 'b', state: 'closed' });
      testData.extendedForms.createPast(1, { name: 'c_closing', xmlFormId: 'c', state: 'closing' });
      testData.extendedForms.createPast(1, { name: 'd_closed', xmlFormId: 'd', state: 'closed' });
      const rows = mountComponent(true).findAllComponents(FormRow);
      rows.length.should.equal(2);
      rows.map((row) => row.props().form.name).should.eql(['b_closed', 'd_closed']);
    });

    it('does not show table header if no closed forms to show', () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { state: 'open' });
      testData.extendedForms.createPast(1, { state: 'open' });
      testData.extendedForms.createPast(1, { state: 'closing' });
      const table = mountComponent(true);
      table.findAll('th').length.should.equal(0);
      table.findAllComponents(FormRow).length.should.equal(0);
    });

    it('does show table header even if no non-open forms to show', () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { state: 'closed' });
      testData.extendedForms.createPast(1, { state: 'closed' });
      const table = mountComponent(false);
      table.findAll('th').length.should.equal(5);
      table.findAllComponents(FormRow).length.should.equal(0);
    });
  });
});
