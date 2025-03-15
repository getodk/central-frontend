import DatasetOverview from '../../../src/components/dataset/overview.vue';
import Breadcrumbs from '../../../src/components/breadcrumbs.vue';
import InfoNav from '../../../src/components/infonav.vue';

import testData from '../../data';
import { findTab, textWithout } from '../../util/dom';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('DatasetShow', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () => {
    testData.extendedDatasets.createPast(1, { name: 'a b' });
    return load('/projects/1/entity-lists/a%20b/properties').testRequests([
      { url: '/v1/projects/1', extended: true },
      { url: '/v1/projects/1/datasets/a%20b', extended: true }
    ]);
  });

  it('shows the correct title', () => {
    testData.extendedDatasets.createPast(1);
    return load('/projects/1/entity-lists/trees/properties').then(app => {
      const title = app.get('#page-head-title');
      title.text().should.be.equal('trees');
    });
  });

  it('re-renders the router view after a route change', () => {
    testData.extendedDatasets
      .createPast(1, { name: 'trees' })
      .createPast(1, { name: 'shovels' });
    let vm;
    return load('/projects/1/entity-lists/trees/properties', {}, {
      dataset: () => testData.extendedDatasets.first()
    })
      .afterResponses(app => {
        vm = app.getComponent(DatasetOverview);
      })
      .load('/projects/1/entity-lists/shovels/properties', {
        dataset: () => testData.extendedDatasets.last(),
        project: false
      })
      .afterResponses(app => {
        expect(app.getComponent(DatasetOverview).vm).to.not.equal(vm);
      });
  });

  it('renders breadcrumbs', async () => {
    testData.extendedDatasets.createPast(1);
    const component = await load('/projects/1/entity-lists/trees/properties');
    const { links } = component.getComponent(Breadcrumbs).props();
    links.length.should.equal(2);
    links[0].path.should.equal('/projects/1');
    links[1].text.should.equal('Entities');
    links[1].path.should.equal('/projects/1/entity-lists');
  });

  it('show correct project name', async () => {
    testData.extendedProjects.createPast(1, { name: 'My Project' });
    testData.extendedDatasets.createPast(1, { name: 'trees', properties: [], linkedForms: [] });
    return load('/projects/1/entity-lists/trees/properties').then(app => {
      const breadcrumb = app.findAll('.breadcrumb-item')[0];
      breadcrumb.text().should.equal('My Project');
    });
  });

  it('appends (archived) to the project name', async () => {
    testData.extendedProjects.createPast(1, { name: 'My Project', archived: true });
    testData.extendedDatasets.createPast(1, { name: 'trees', properties: [], linkedForms: [] });
    return load('/projects/1/entity-lists/trees/properties').then(app => {
      const breadcrumb = app.findAll('.breadcrumb-item')[0];
      breadcrumb.text().should.equal('My Project (archived)');
    });
  });

  describe('form links in infonav buttons', () => {
    it('shows no related forms', async () => {
      testData.extendedDatasets.createPast(1);
      const app = await load('/projects/1/entity-lists/trees/properties');
      const buttons = app.findAllComponents(InfoNav);
      buttons.length.should.equal(0);
    });

    it('shows forms that consume the dataset', async () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees', linkedForms: [
          { name: 'Diagnosis', xmlFormId: 'monthly_diagnosis' },
          { name: 'National Parks Survey', xmlFormId: 'national_parks_survey' }
        ]
      });
      const app = await load('/projects/1/entity-lists/trees/properties');
      const buttons = app.findAllComponents(InfoNav);
      buttons.length.should.equal(1);
      buttons[0].get('button').text().should.equal('Used in 2 Forms');
      buttons[0].findAll('.dropdown-menu > li').map(li => li.text()).should.eql(['Diagnosis', 'National Parks Survey']);
    });

    it('shows forms that update the dataset', async () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees', properties: [
          {
            name: 'height',
            forms: [
              { name: 'Tree Registration', xmlFormId: 'tree_registration' },
              { name: 'Tree Monitoring', xmlFormId: 'tree_registration_adv' }
            ]
          }
        ],
        sourceForms: [
          { name: 'Tree Registration', xmlFormId: 'tree_registration' },
          { name: 'Tree Monitoring', xmlFormId: 'tree_registration_adv' },
        ]
      });
      const app = await load('/projects/1/entity-lists/trees/properties');
      const buttons = app.findAllComponents(InfoNav);
      buttons.length.should.equal(1);
      buttons[0].get('button').text().should.equal('Updated by 2 Forms');
      buttons[0].findAll('.dropdown-menu > li').map(li => li.text()).should.eql(['Tree Registration', 'Tree Monitoring']);
    });

    it('shows both buttons for both kinds of forms', async () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees',
        linkedForms: [
          { name: 'Tree Monitoring', xmlFormId: 'tree_monitoring' },
        ],
        properties: [
          {
            name: 'height',
            forms: [
              { name: 'Tree Registration', xmlFormId: 'tree_registration' },
            ]
          }
        ],
        sourceForms: [
          { name: 'Tree Registration', xmlFormId: 'tree_registration' },
        ]
      });
      const app = await load('/projects/1/entity-lists/trees/properties');
      const buttons = app.findAllComponents(InfoNav);
      buttons.length.should.equal(2);
      buttons[0].get('button').text().should.equal('Updated by 1 Form');
      buttons[1].get('button').text().should.equal('Used in 1 Form');
    });
  });

  describe('tabs', () => {
    it('shows all tabs to an administrator', async () => {
      testData.extendedDatasets.createPast(1);
      const app = await load('/projects/1/entity-lists/trees/properties');
      const text = app.findAll('#page-head-tabs li')
        .map(li => textWithout(li.get('a'), '.badge'));
      text.should.eql(['Entities', 'Properties', 'Settings']);
    });

    it('shows the correct tabs to project viewer', async () => {
      testData.extendedUsers.reset();
      testData.sessions.reset();
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer' });
      testData.extendedDatasets.createPast(1);

      const app = await load('/projects/1/entity-lists/trees/properties');
      const text = app.findAll('#page-head-tabs li')
        .map(li => textWithout(li.get('a'), '.badge'));
      text.should.eql(['Entities', 'Properties']);
    });

    it('shows the count of entities', async () => {
      testData.extendedDatasets.createPast(1, { entities: 1000 });
      const app = await load('/projects/1/entity-lists/trees/properties');
      findTab(app, 'Entities').get('.badge').text().should.equal('1,000');
    });
  });
});
