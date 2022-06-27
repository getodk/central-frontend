import ProjectOverviewDescription from '../../../src/components/project/overview/description.vue';
import FormList from '../../../src/components/form/list.vue';
import FormRow from '../../../src/components/form/row.vue';
import FormTrashList from '../../../src/components/form/trash-list.vue';
import FormTrashRow from '../../../src/components/form/trash-row.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ProjectOverview', () => {
  describe('project description', () => {
    it('allows admins to see instructions about editing', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedProjects.createPast(1);
      const app = await load('/projects/1');
      const desc = app.getComponent(ProjectOverviewDescription);
      desc.props().description.should.equal('');
      desc.props().canUpdate.should.equal(true);
    });

    it('allows managers to see instructions about editing', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'manager' });
      const app = await load('/projects/1');
      const desc = app.getComponent(ProjectOverviewDescription);
      desc.props().description.should.equal('');
      desc.props().canUpdate.should.equal(true);
    });

    it('does not allow viewers to see instructions about editing', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer' });
      const app = await load('/projects/1', {}, { deletedForms: false });
      const desc = app.getComponent(ProjectOverviewDescription);
      desc.props().description.should.equal('');
      desc.props().canUpdate.should.equal(false);
    });

    it('passes project description through', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedProjects.createPast(1, { description: 'Description' });
      const app = await load('/projects/1');
      const desc = app.getComponent(ProjectOverviewDescription);
      desc.props().description.should.equal('Description');
      desc.props().canUpdate.should.equal(true);
    });
  });

  // These tests are in project overview because this component
  // does/does not include the trashed forms component based on
  // permissions of the given user and project. (And those
  // permissions may not be immediately available.)
  describe('trashed forms section', () => {
    it('shows trashed forms to admins', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedProjects.createPast(1);
      const app = await load('/projects/1', {}, {
        deletedForms: () => [
          { xmlFormId: '15_days_ago', deletedAt: new Date().toISOString() }
        ]
      });
      app.getComponent(FormTrashList).should.be.visible();
    });

    it('shows trashed forms to managers', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'manager' });
      const app = await load('/projects/1', {}, {
        deletedForms: () => [{ xmlFormId: '15_days_ago', deletedAt: new Date().toISOString() }]
      });
      app.getComponent(FormTrashList).should.be.visible();
    });

    for (const role of ['viewer', 'formfill']) {
      it(`does not show trashed forms to ${role}`, async () => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role });
        const app = await load('/projects/1', {}, { deletedForms: false });
        app.findComponent(FormTrashList).exists().should.be.false();
      });
    }

    it('does not show trash until project permissions are returned', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'manager' });
      return load('/projects/1', {}, {
        deletedForms: () => [
          { xmlFormId: '15_days_ago', deletedAt: new Date().toISOString() }
        ]
      })
        .beforeEachResponse((app, { url }) => {
          if (url === '/v1/projects/1')
            app.findComponent(FormTrashList).exists().should.be.false();
          else {
            app.findComponent(FormTrashList).exists().should.be.true();
            app.findAllComponents(FormTrashRow).length.should.equal(0);
          }
        })
        .afterResponses(app => {
          app.getComponent(FormTrashList).should.be.visible();
          app.findAllComponents(FormTrashRow).length.should.equal(1);
        });
    });
  });

  describe('duplicate form names', () => {
    it('shows form ID in parentheses next to form names that are duplicated', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { name: 'Same Name', xmlFormId: 'foo' });
      testData.extendedForms.createPast(1, { name: 'Same Name', xmlFormId: 'bar' });
      testData.extendedForms.createPast(1, { name: 'Different Name', xmlFormId: 'baz' });
      const app = await load('/projects/1', {}, {});
      const rows = app.getComponent(FormList).findAllComponents(FormRow);
      rows.map((row) => row.find('.name').text()).should.eql([
        'Different Name',
        'Same Name(foo)',
        'Same Name(bar)'
      ]);
    });

    it('considers different capitalizations to be the same and shows form ID', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { name: 'Same Name', xmlFormId: 'foo' });
      testData.extendedForms.createPast(1, { name: 'same NAME', xmlFormId: 'bar' });
      const app = await load('/projects/1', {}, {});
      const rows = app.getComponent(FormList).findAllComponents(FormRow);
      rows.map((row) => row.find('.name').text()).should.eql([
        'same NAME(bar)',
        'Same Name(foo)'
      ]);
    });

    it('shows form ID even when form is in separate closed table', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { name: 'Same Name', xmlFormId: 'foo', state: 'closed' });
      testData.extendedForms.createPast(1, { name: 'Same Name', xmlFormId: 'bar', state: 'open' });
      const app = await load('/projects/1', {}, {});
      const rows = app.getComponent(FormList).findAllComponents(FormRow);
      rows.map((row) => row.find('.name').text()).should.eql([
        'Same Name(bar)',
        'Same Name(foo)'
      ]);
    });

    it('shows form ID even when duplicate form name is in trash', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { name: 'Same Name', xmlFormId: 'foo' });
      const app = await load('/projects/1', {}, {
        deletedForms: () => [{ name: 'Same Name', xmlFormId: 'bar', deletedAt: new Date().toISOString() }]
      });
      const formList = app.getComponent(FormList);
      formList.find('.duplicate-form-id').text().should.equal('(foo)');
      const trashList = app.getComponent(FormTrashList);
      trashList.find('.duplicate-form-id').text().should.equal('(bar)');
    });
  });
});
