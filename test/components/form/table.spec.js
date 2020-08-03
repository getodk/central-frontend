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
      headers.should.eql(['Name', 'ID and Version', 'Submissions', 'Actions']);
      table.find('td').length.should.equal(4);
    });

    it('shows the correct columns to a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1');
      const table = app.first(FormTable);
      const headers = table.find('th').map(th => th.text().trim());
      headers.should.eql(['Name', 'Submissions']);
      const td = table.find('td');
      td.length.should.equal(2);
      td[0].hasClass('name').should.be.true();
      td[1].hasClass('submissions').should.be.true();
    });

    it('shows the correct columns to a Data Collector', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1');
      const table = app.first(FormTable);
      const headers = table.find('th').map(th => th.text().trim());
      headers.should.eql(['Name', 'ID and Version', 'Actions']);
      const td = table.find('td');
      td.length.should.equal(3);
      td[0].hasClass('name').should.be.true();
      td[1].hasClass('id-and-version').should.be.true();
      td[2].hasClass('actions').should.be.true();
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
      const names = app.find('.form-row .name')
        .map(wrapper => wrapper.text().trim());
      names.should.eql(['My Draft Form', 'My Published Form']);
    });

    it('shows a form without a published version to a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 2 });
      testData.extendedForms.createPast(1, { name: 'My Published Form' });
      testData.extendedForms.createPast(1, {
        name: 'My Draft Form',
        draft: true
      });
      const app = await load('/projects/1');
      const names = app.find('.form-row .name')
        .map(wrapper => wrapper.text().trim());
      names.should.eql(['My Draft Form', 'My Published Form']);
    });

    it('does not show form without published version to Data Collector', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'formfill', forms: 2 });
      testData.extendedForms.createPast(1, { name: 'My Published Form' });
      testData.extendedForms.createPast(1, {
        name: 'My Draft Form',
        draft: true
      });
      const app = await load('/projects/1');
      const names = app.find('.form-row .name')
        .map(wrapper => wrapper.text().trim());
      names.should.eql(['My Published Form']);
    });
  });
});
