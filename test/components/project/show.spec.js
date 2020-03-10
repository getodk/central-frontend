import Loading from '../../../src/components/loading.vue';
import NotFound from '../../../src/components/not-found.vue';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRoute } from '../../util/http';

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

  it('only shows the Overview tab to a project viewer', () => {
    mockLogin({ role: 'none' });
    return mockRoute('/projects/1')
      .respondWithData(() =>
        testData.extendedProjects.createPast(1, { role: 'viewer' }).last())
      .respondWithData(() => testData.extendedForms.sorted())
      .afterResponses(app => {
        const tabs = app.find('#page-head-tabs a');
        tabs.length.should.equal(1);
        tabs[0].text().should.equal('Overview');
      });
  });
});
