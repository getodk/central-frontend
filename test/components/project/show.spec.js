import Loading from '../../../src/components/loading.vue';
import NotFound from '../../../src/components/not-found.vue';
import testData from '../../data';
import { load, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ProjectShow', () => {
  it('requires projectId route param to be integer', () =>
    mockRoute('/projects/p')
      .then(app => {
        app.find(NotFound).length.should.equal(1);
      }));

  it("shows the project's name", () => {
    mockLogin();
    return mockRoute('/projects/1')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() => testData.extendedForms.sorted())
      .afterResponses(app => {
        const project = testData.extendedProjects.last();
        app.first('#page-head-title').text().trim().should.equal(project.name);
      });
  });

  it("appends (archived) to an archived project's name", () => {
    mockLogin();
    return mockRoute('/projects/1')
      .respondWithData(() => testData.extendedProjects
        .createPast(1, { name: 'My Project', archived: true })
        .last())
      .respondWithData(() => testData.extendedForms.sorted())
      .afterResponses(app => {
        const title = app.first('#page-head-title').text().trim();
        title.should.equal('My Project (archived)');
      });
  });

  it('shows a loading message until all responses are received', () => {
    mockLogin();
    return mockRoute('/projects/1')
      .beforeEachResponse((app, config, index) => {
        const loading = app.find(Loading);
        loading.length.should.equal(2);
        // ProjectShow
        loading[0].getProp('state').should.equal(index === 0);
        // ProjectOverview
        loading[1].getProp('state').should.equal(true);
      })
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() => testData.extendedForms.createPast(1).sorted())
      .afterResponses(app => {
        const loading = app.find(Loading);
        const states = loading.map(component => component.getProp('state'));
        states.should.eql([false, false]);
      });
  });

  describe('tabs', () => {
    it('shows the tabs to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedProjects.createPast(1);
      const app = await load('/projects/1', { attachToDocument: true }, {});
      const li = app.find('#page-head-tabs li');
      li.length.should.be.above(1);
      li[0].should.be.visible(true);
    });

    for (const role of ['viewer', 'formfill']) {
      it(`does not show the tabs to a ${role}`, async () => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role });
        const app = await load('/projects/1', { attachToDocument: true }, {});
        const li = app.find('#page-head-tabs li');
        li.length.should.equal(1);
        li[0].should.be.hidden(true);
      });
    }
  });
});
