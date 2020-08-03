import FormList from '../../../src/components/form/list.vue';
import PageSection from '../../../src/components/page/section.vue';
import ProjectOverviewAbout from '../../../src/components/project/overview/about.vue';
import ProjectOverviewRightNow from '../../../src/components/project/overview/right-now.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ProjectOverview', () => {
  it('does not send a new request if user navigates back to tab', () => {
    mockLogin();
    testData.extendedProjects.createPast(1);
    return load('/projects/1')
      .complete()
      .route('/projects/1/settings')
      .complete()
      .route('/projects/1')
      .testNoRequest();
  });

  describe('top row', () => {
    it('shows the row to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedProjects.createPast(1);
      const app = await load('/projects/1');
      app.first(ProjectOverviewAbout).should.be.visible();
      app.first(ProjectOverviewRightNow).should.be.visible();
      const section = app.first(FormList).first(PageSection);
      section.getProp('condensed').should.be.false();
    });

    for (const role of ['viewer', 'formfill']) {
      it(`does not render the row for a ${role}`, async () => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role });
        const app = await load('/projects/1');
        app.find(ProjectOverviewAbout).length.should.equal(0);
        app.find(ProjectOverviewRightNow).length.should.equal(0);
        const section = app.first(FormList).first(PageSection);
        section.getProp('condensed').should.be.true();
      });
    }
  });
});
