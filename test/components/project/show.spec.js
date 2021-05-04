import Loading from '../../../src/components/loading.vue';
import NotFound from '../../../src/components/not-found.vue';
import ProjectOverview from '../../../src/components/project/overview.vue';
import testData from '../../data';
import { load, mockRoute } from '../../util/http';
import { loadLocale } from '../../../src/util/i18n';
import { mockLogin } from '../../util/session';

describe('ProjectShow', () => {
  it('requires projectId route param to be integer', () =>
    mockRoute('/projects/p')
      .then(app => {
        app.find(NotFound).length.should.equal(1);
      }));

  it('re-renders the router view after a route change', () => {
    mockLogin();
    testData.extendedProjects.createPast(2);
    let vm;
    return load('/projects/1', {}, {
      project: () => testData.extendedProjects.first()
    })
      .afterResponses(app => {
        vm = app.first(ProjectOverview).vm;
      })
      .load('/projects/2', {
        project: () => testData.extendedProjects.last()
      })
      .afterResponses(app => {
        app.first(ProjectOverview).vm.should.not.equal(vm);
      });
  });

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

  it('updates (archived) after a locale change', async () => {
    mockLogin();
    testData.extendedProjects.createPast(1, {
      name: 'My Project',
      archived: true
    });
    const app = await load('/projects/1');
    const title = app.first('#page-head-title');
    title.text().trim().should.equal('My Project (archived)');
    app.vm.$root.$i18n.locale = 'es';
    await loadLocale('es');
    await app.vm.$nextTick();
    try {
      title.text().trim().should.equal('My Project (archivado)');
    } finally {
      app.vm.$root.$i18n.locale = 'en';
    }
  });

  it('shows a loading message until response for project is received', () => {
    mockLogin();
    testData.extendedProjects.createPast(1);
    return load('/projects/1/settings')
      .beforeEachResponse(app => {
        const loading = app.find(Loading);
        loading.length.should.equal(2);
        loading[0].getProp('state').should.equal(true);
      })
      .afterResponses(app => {
        const loading = app.find(Loading);
        loading.length.should.equal(2);
        loading[0].getProp('state').should.equal(false);
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
