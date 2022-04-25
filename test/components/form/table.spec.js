import FormTable from '../../../src/components/form/table.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormTable', () => {
  describe('number of columns', () => {
    it('shows all columns to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1');
      const table = app.getComponent(FormTable);
      const headers = table.findAll('th').map(th => th.text());
      headers.should.eql(['Name', 'ID and Version', 'Submissions', 'Actions']);
      table.findAll('td').length.should.equal(4);
    });

    it('shows the correct columns to a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1', {}, { deletedForms: false });
      const table = app.getComponent(FormTable);
      const headers = table.findAll('th').map(th => th.text());
      headers.should.eql(['Name', 'Submissions']);
      const td = table.findAll('td');
      td.length.should.equal(2);
      td[0].classes('name').should.be.true();
      td[1].classes('submissions').should.be.true();
    });

    it('shows the correct columns to a Data Collector', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1', {}, { deletedForms: false });
      const table = app.getComponent(FormTable);
      const headers = table.findAll('th').map(th => th.text());
      headers.should.eql(['Name', 'ID and Version', 'Actions']);
      const td = table.findAll('td');
      td.length.should.equal(3);
      td[0].classes('name').should.be.true();
      td[1].classes('id-and-version').should.be.true();
      td[2].classes('actions').should.be.true();
    });
  });

  describe('number of rows', () => {
    it('shows a form without a published version to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedProjects.createPast(1, { forms: 2 });
      testData.extendedForms.createPast(1, { name: 'My Published Form' });
      testData.extendedForms.createPast(1, {
        name: 'My Draft Form',
        draft: true
      });
      const app = await load('/projects/1');
      const text = app.findAll('.form-row .name').map(td => td.text());
      text.should.eql(['My Draft Form', 'My Published Form']);
    });

    it('shows a form without a published version to a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 2 });
      testData.extendedForms.createPast(1, { name: 'My Published Form' });
      testData.extendedForms.createPast(1, {
        name: 'My Draft Form',
        draft: true
      });
      const app = await load('/projects/1', {}, { deletedForms: false });
      const text = app.findAll('.form-row .name').map(td => td.text());
      text.should.eql(['My Draft Form', 'My Published Form']);
    });

    it('does not show form without published version to Data Collector', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'formfill', forms: 2 });
      testData.extendedForms.createPast(1, { name: 'My Published Form' });
      testData.extendedForms.createPast(1, {
        name: 'My Draft Form',
        draft: true
      });
      const app = await load('/projects/1', {}, { deletedForms: false });
      const text = app.findAll('.form-row .name').map(td => td.text());
      text.should.eql(['My Published Form']);
    });
  });
});
