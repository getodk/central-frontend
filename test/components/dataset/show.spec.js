import DatasetOverview from '../../../src/components/dataset/overview.vue';
import Breadcrumbs from '../../../src/components/breadcrumbs.vue';

import testData from '../../data';
import { findTab } from '../../util/dom';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('DatasetShow', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () => {
    testData.extendedDatasets.createPast(1, { name: 'a b' });
    return load('/projects/1/entity-lists/a%20b').testRequests([
      { url: '/v1/projects/1', extended: true },
      { url: '/v1/projects/1/datasets/a%20b', extended: true }
    ]);
  });

  it('shows the correct title', () => {
    testData.extendedDatasets.createPast(1);
    return load('/projects/1/entity-lists/trees').then(app => {
      const title = app.get('#page-head-title');
      title.text().should.be.equal('trees');
    });
  });

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
        expect(app.getComponent(DatasetOverview).vm).to.not.equal(vm);
      });
  });

  it('renders breadcrumbs', async () => {
    testData.extendedDatasets.createPast(1);
    const component = await load('/projects/1/entity-lists/trees');
    const { links } = component.getComponent(Breadcrumbs).props();
    links.length.should.equal(2);
    links[0].path.should.equal('/projects/1');
    links[1].text.should.equal('Entities');
    links[1].path.should.equal('/projects/1/entity-lists');
  });

  it('show correct project name', async () => {
    testData.extendedProjects.createPast(1, { name: 'My Project' });
    testData.extendedDatasets.createPast(1, { name: 'trees', properties: [], linkedForms: [] });
    return load('/projects/1/entity-lists/trees').then(app => {
      const breadcrumb = app.findAll('.breadcrumb-item')[0];
      breadcrumb.text().should.equal('My Project');
    });
  });

  it('appends (archived) to the project name', async () => {
    testData.extendedProjects.createPast(1, { name: 'My Project', archived: true });
    testData.extendedDatasets.createPast(1, { name: 'trees', properties: [], linkedForms: [] });
    return load('/projects/1/entity-lists/trees').then(app => {
      const breadcrumb = app.findAll('.breadcrumb-item')[0];
      breadcrumb.text().should.equal('My Project (archived)');
    });
  });


  describe('tabs', () => {
    it('shows all tabs to an administrator', async () => {
      testData.extendedDatasets.createPast(1);
      const app = await load('/projects/1/entity-lists/trees', { attachTo: document.body });
      const li = app.findAll('#page-head-tabs li');
      li.map(wrapper => wrapper.get('a').text()).should.eql(['Overview', 'Data 0', 'Settings']);
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
      text.should.eql(['Overview', 'Data 0']);
      li[0].should.be.visible(true);
    });

    it('shows the count of entities', async () => {
      testData.extendedDatasets.createPast(1, { entities: 1000 });
      const app = await load('/projects/1/entity-lists/trees');
      findTab(app, 'Data').get('.badge').text().should.equal('1,000');
    });
  });
});
