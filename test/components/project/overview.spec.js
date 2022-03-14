import FormTrashList from '../../../src/components/form/trash-list.vue';
import FormTrashRow from '../../../src/components/form/trash-row.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ProjectOverview', () => {
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
