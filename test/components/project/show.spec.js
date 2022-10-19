import Loading from '../../../src/components/loading.vue';
import NotFound from '../../../src/components/not-found.vue';
import ProjectOverview from '../../../src/components/project/overview.vue';

import { loadLocale } from '../../../src/util/i18n';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ProjectShow', () => {
  it('requires the projectId route param to be integer', async () => {
    const app = await load('/projects/p');
    app.findComponent(NotFound).exists().should.be.true();
  });

  it('sends the correct initial requests', () => {
    mockLogin();
    testData.extendedProjects.createPast(1);
    return load('/projects/1/settings').testRequests([
      { url: '/v1/projects/1', extended: true }
    ]);
  });

  describe('requestData reconciliation', () => {
    beforeEach(mockLogin);

    it('reconciles project and forms', async () => {
      testData.extendedProjects.createPast(1, { forms: 1 });
      testData.extendedForms.createPast(2);
      const app = await load('/projects/1');
      app.vm.$container.requestData.project.forms.should.equal(2);
    });

    it('reconciles project and datasets', async () => {
      testData.extendedProjects.createPast(1, { datasets: 1 });
      testData.extendedDatasets.createPast(2);
      const app = await load('/projects/1/datasets');
      app.vm.$container.requestData.project.datasets.should.equal(2);
    });

    it('reconciles project and fieldKeys', async () => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      testData.extendedFieldKeys.createPast(2);
      const app = await load('/projects/1/app-users');
      app.vm.$container.requestData.project.appUsers.should.equal(2);
    });

    describe('forms and datasets', () => {
      beforeEach(() => {
        testData.extendedDatasets.createPast(1);
      });

      it('clears datasets after a request for forms', () =>
        load('/projects/1/datasets')
          .afterResponses(app => {
            const { datasets } = app.vm.$container.requestData.localResources;
            datasets.dataExists.should.be.true();
          })
          .load('/projects/1', { project: false })
          .afterResponses(app => {
            const { datasets } = app.vm.$container.requestData.localResources;
            datasets.dataExists.should.be.false();
          })
          .load('/projects/1/datasets', { project: false })
          .afterResponses(app => {
            const { datasets } = app.vm.$container.requestData.localResources;
            datasets.dataExists.should.be.true();
          }));

      it('does not clear datasets if forms are not re-requested', () =>
        load('/projects/1')
          .complete()
          .load('/projects/1/datasets', { project: false })
          .complete()
          .route('/projects/1')
          .afterResponses(app => {
            const { datasets } = app.vm.$container.requestData.localResources;
            datasets.dataExists.should.be.true();
          }));
    });
  });

  it('re-renders the router view after a route change', () => {
    mockLogin();
    testData.extendedProjects.createPast(2);
    let vm;
    return load('/projects/1', {}, {
      project: () => testData.extendedProjects.first()
    })
      .afterResponses(app => {
        vm = app.getComponent(ProjectOverview).vm;
      })
      .load('/projects/2', {
        project: () => testData.extendedProjects.last()
      })
      .afterResponses(app => {
        should(app.getComponent(ProjectOverview).vm).not.equal(vm);
      });
  });

  describe('title', () => {
    it("shows the project's name", async () => {
      mockLogin();
      testData.extendedProjects.createPast(1, { name: 'My Project' });
      const app = await load('/projects/1');
      app.get('#page-head-title').text().should.equal('My Project');
    });

    it("appends (archived) to an archived project's name", async () => {
      mockLogin();
      testData.extendedProjects.createPast(1, {
        name: 'My Project',
        archived: true
      });
      const app = await load('/projects/1');
      app.get('#page-head-title').text().should.equal('My Project (archived)');
    });

    it('updates (archived) after a locale change', async () => {
      mockLogin();
      testData.extendedProjects.createPast(1, {
        name: 'My Project',
        archived: true
      });
      const app = await load('/projects/1');
      const title = app.get('#page-head-title');
      title.text().should.equal('My Project (archived)');
      await loadLocale(app.vm.$container, 'es');
      await app.vm.$nextTick();
      title.text().should.equal('My Project (archivado)');
    });
  });

  describe('tabs', () => {
    it('shows all tabs to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedDatasets.createPast(1);
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1', { attachTo: document.body });
      const li = app.findAll('#page-head-tabs li');
      li.map(wrapper => wrapper.get('a').text()).should.eql([
        'Overview',
        'Project Roles',
        'App Users',
        'Form Access',
        'Datasets',
        'Settings'
      ]);
      li[0].should.be.visible(true);
    });

    describe('project viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
      });

      it('shows the correct tabs if the project has a dataset', async () => {
        testData.extendedProjects.createPast(1, {
          datasets: 1,
          role: 'viewer'
        });
        testData.extendedForms.createPast(1);
        const app = await load('/projects/1', { attachTo: document.body }, {
          deletedForms: false
        });
        const li = app.findAll('#page-head-tabs li');
        const text = li.map(wrapper => wrapper.get('a').text());
        text.should.eql(['Overview', 'Datasets']);
        li[0].should.be.visible(true);
      });

      it('does not show tabs if project does not have a dataset', async () => {
        testData.extendedProjects.createPast(1, { role: 'viewer' });
        const app = await load('/projects/1', { attachTo: document.body }, {
          deletedForms: false
        });
        const li = app.findAll('#page-head-tabs li');
        li.length.should.equal(1);
        li[0].should.be.hidden(true);
      });
    });

    it('does not show tabs to a Data Collector', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'formfill' });
      const app = await load('/projects/1', { attachTo: document.body }, {
        deletedForms: false
      });
      const li = app.findAll('#page-head-tabs li');
      li.length.should.equal(1);
      li[0].should.be.hidden(true);
    });
  });

  it('shows a loading message until response for project is received', () => {
    mockLogin();
    testData.extendedProjects.createPast(1);
    return load('/projects/1/settings')
      .beforeEachResponse(app => {
        const loading = app.findAllComponents(Loading);
        loading.length.should.equal(2);
        loading[0].props().state.should.equal(true);
      })
      .afterResponses(app => {
        const loading = app.findAllComponents(Loading);
        loading.length.should.equal(2);
        loading[0].props().state.should.equal(false);
      });
  });
});
