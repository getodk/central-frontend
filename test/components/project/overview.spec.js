import FormList from '../../../src/components/form/list.vue';
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
        const app = await load('/projects/1');
        app.findComponent(ProjectOverviewAbout).exists().should.be.false();
        app.findComponent(ProjectOverviewRightNow).exists().should.be.false();
        const section = app.getComponent(FormList).getComponent(PageSection);
        section.props().condensed.should.be.true();
      });
    }
  });
});
