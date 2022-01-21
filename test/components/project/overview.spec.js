import FormList from '../../../src/components/form/list.vue';
import FormTrashList from '../../../src/components/form/trash-list.vue';
import FormTrashRow from '../../../src/components/form/trash-row.vue';
import PageSection from '../../../src/components/page/section.vue';
import ProjectOverviewAbout from '../../../src/components/project/overview/about.vue';
import ProjectOverviewRightNow from '../../../src/components/project/overview/right-now.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ProjectOverview', () => {
  describe('top row', () => {
    it('shows the row to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedProjects.createPast(1);
      const app = await load('/projects/1');
      app.getComponent(ProjectOverviewAbout).should.be.visible();
      app.getComponent(ProjectOverviewRightNow).should.be.visible();
      const section = app.getComponent(FormList).getComponent(PageSection);
      section.props().condensed.should.be.false();
    });

    for (const role of ['viewer', 'formfill']) {
      it(`does not render the row for a ${role}`, async () => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role });
        const app = await load('/projects/1', {}, { deletedForms: false });
        app.findComponent(ProjectOverviewAbout).exists().should.be.false();
        app.findComponent(ProjectOverviewRightNow).exists().should.be.false();
        const section = app.getComponent(FormList).getComponent(PageSection);
        section.props().condensed.should.be.true();
      });
    }
  });

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
});
