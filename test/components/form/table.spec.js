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
      const table = app.first(FormTable);
      const headers = table.find('th').map(th => th.text().trim());
      headers.should.eql(['Name', 'ID/Version', 'Submissions', 'Actions']);
      table.find('td').length.should.equal(4);
    });

    it('shows all columns to a Data Collector', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1');
      const table = app.first(FormTable);
      const headers = table.find('th').map(th => th.text().trim());
      headers.should.eql(['Name', 'ID/Version', 'Submissions', 'Actions']);
      table.find('td').length.should.equal(4);
    });

    it('shows fewer columns to a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1');
      const table = app.first(FormTable);
      const headers = table.find('th').map(th => th.text().trim());
      headers.should.eql(['Name', 'Submissions']);
      table.find('td').length.should.equal(2);
    });
  });
});
