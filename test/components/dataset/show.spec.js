import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

import PageBack from '../../../src/components/page/back.vue';
import DatasetOverview from '../../../src/components/dataset/overview.vue';
import testData from '../../data';

describe('DatasetShow', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () => {
    testData.extendedDatasets.createPast(1, { name: 'a b' });
    return load('/projects/1/entity-lists/a%20b').testRequests([
      { url: '/v1/projects/1', extended: true },
      { url: '/v1/projects/1/datasets/a%20b', extended: true }
    ]);
  });

  it('shows the correct title', () =>
    load('/projects/1/entity-lists/trees').then(app => {
      const title = app.get('#page-head-title');
      title.text().should.be.equal('trees');
    }));

  it('re-renders the router view after a route change', () => {
    testData.extendedDatasets
      .createPast(1, { name: 'trees' })
      .createPast(1, { name: 'shovels' });
    let vm;
    return load('/projects/1/entity-lists/trees', {}, {
      dataset: () => testData.extendedDatasets.first()
    })
      .afterResponses(app => {
        vm = app.getComponent(DatasetOverview);
      })
      .load('/projects/1/entity-lists/shovels', {
        dataset: () => testData.extendedDatasets.last(),
        project: false
      })
      .afterResponses(app => {
        should(app.getComponent(DatasetOverview).vm).not.equal(vm);
      });
  });

  it('renders a back link', async () => {
    const component = await load('/projects/1/entity-lists/trees');
    const { to } = component.getComponent(PageBack).props();
    to.should.eql(['/projects/1', '/projects/1/entity-lists']);
  });

  it('show correct project name', async () => {
    testData.extendedProjects.createPast(1, { name: 'My Project' });
    testData.extendedDatasets.createPast(1, { name: 'trees', properties: [], linkedForms: [] });
    return load('/projects/1/entity-lists/trees').then(app => {
      app.get('#page-back-title').text().should.equal('My Project');
    });
  });

  it('appends (archived) to the project name', async () => {
    testData.extendedProjects.createPast(1, { name: 'My Project', archived: true });
    testData.extendedDatasets.createPast(1, { name: 'trees', properties: [], linkedForms: [] });
    return load('/projects/1/entity-lists/trees').then(app => {
      app.get('#page-back-title').text().should.equal('My Project (archived)');
    });
  });


  describe('tabs', () => {
    it('shows all tabs to an administrator', async () => {
      testData.extendedDatasets.createPast(1);
      const app = await load('/projects/1/entity-lists/trees', { attachTo: document.body });
      const li = app.findAll('#page-head-tabs li');
      li.map(wrapper => wrapper.get('a').text()).should.eql(['Overview', 'Data', 'Settings']);
      li[0].should.be.visible(true);
    });

    it('shows the correct tabs to project viewer', async () => {
      testData.extendedUsers.reset();
      testData.sessions.reset();
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer' });
      testData.extendedDatasets.createPast(1);

      const app = await load('/projects/1/entity-lists/trees', { attachTo: document.body });
      const li = app.findAll('#page-head-tabs li');
      const text = li.map(wrapper => wrapper.get('a').text());
      text.should.eql(['Overview', 'Data']);
      li[0].should.be.visible(true);
    });
  });
});
