import Breadcrumbs from '../../../src/components/breadcrumbs.vue';
import Infonav from '../../../src/components/infonav.vue';

import testData from '../../data';
import Property from '../../util/ds-property-enum';
import { findTab, textWithout } from '../../util/dom';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormHead', () => {
  describe('names and links', () => {
    beforeEach(mockLogin);

    it("shows the project's name in the breadcrumb", () => {
      testData.extendedProjects.createPast(1, { name: 'My Project', forms: 1 });
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/settings').then(app => {
        const breadcrumb = app.findAll('.breadcrumb-item')[0];
        breadcrumb.text().should.equal('My Project');
      });
    });

    it("appends (archived) to an archived project's name in the breadcrumb", () => {
      testData.extendedProjects.createPast(1, {
        name: 'My Project',
        archived: true,
        forms: 1
      });
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/settings').then(app => {
        const breadcrumb = app.findAll('.breadcrumb-item')[0];
        breadcrumb.text().should.equal('My Project (archived)');
      });
    });

    it("renders the project's name as a link in the breadcrumb", async () => {
      testData.extendedForms.createPast(1, { name: 'My Form' });
      const component = await load('/projects/1/forms/f/settings');
      const { links } = component.getComponent(Breadcrumbs).props();
      links.length.should.equal(2);
      links[0].path.should.equal('/projects/1');
      links[1].text.should.equal('My Form');
      links[1].path.should.equal('/projects/1/forms/f');
    });

    it('links to the draft form in the breadcrumb if unpublished', async () => {
      testData.extendedForms.createPast(1, { name: 'My Form', draft: true });
      const component = await load('/projects/1/forms/f/draft');
      const { links } = component.getComponent(Breadcrumbs).props();
      links.length.should.equal(2);
      links[0].path.should.equal('/projects/1');
      links[1].text.should.equal('My Form');
      links[1].path.should.equal('');
    });

    it("shows the form's name", async () => {
      testData.extendedForms.createPast(1, { name: 'My Form' });
      const app = await load('/projects/1/forms/f/settings');
      app.get('#page-head-title').text().should.equal('My Form');
    });

    it("shows the form's xmlFormId if the form does not have a name", async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'my_form', name: null });
      const app = await load('/projects/1/forms/my_form/settings');
      app.get('#page-head-title').text().should.equal('my_form');
    });
  });

  describe('infonav buttons', () => {
    beforeEach(mockLogin);

    describe('app user count', () => {
      it('shows the number of app users in a button when there are 0 app users', async () => {
        testData.extendedForms.createPast(1);
        const app = await load('/projects/1/forms/f/settings');
        const infonav = app.getComponent(Infonav);
        infonav.text().should.equal('0 App Users assigned');
        const { link } = infonav.props();
        link.should.equal('/projects/1/form-access');
      });

      it('shows the number of app users in a button when there are multiple app users', async () => {
        testData.extendedFieldKeys.createPast(2);
        const app = await load('/projects/1/forms/f/settings');
        const button = app.find('.infonav-button > a');
        button.text().should.equal('2 App Users assigned');
      });
    });

    describe('entity lists in infonav buttons', () => {
      it('shows no related entity lists', async () => {
        testData.extendedProjects.createPast(1, { forms: 1 });
        const app = await load('/projects/1/forms/f/settings');
        const buttons = app.findAllComponents(Infonav);
        buttons.length.should.equal(1);
        buttons[0].text().should.equal('0 App Users assigned');
      });

      it('shows only entity lists updated by the form', async () => {
        testData.extendedForms.createPast(1);
        testData.formDatasetDiffs.createPast(1, { name: 'trees', properties: [Property.DefaultProperty] });
        const app = await load('/projects/1/forms/f/settings');
        const buttons = app.findAllComponents(Infonav);
        buttons.length.should.equal(2);
        buttons[0].get('button').text().should.equal('1 Related Entity List');
        buttons[0].findAll('.dropdown-menu > li').map(li => li.text()).should.eql(['Updates', 'trees']);
      });

      it('shows only entity lists used in the form', async () => {
        testData.extendedForms.createPast(1);
        testData.standardFormAttachments.createPast(1, { type: 'file', name: 'shovels.csv', datasetExists: true });
        const app = await load('/projects/1/forms/f/settings');
        const buttons = app.findAllComponents(Infonav);
        buttons.length.should.equal(2);
        buttons[0].get('button').text().should.equal('1 Related Entity List');
        buttons[0].findAll('.dropdown-menu > li').map(li => li.text()).should.eql(['Uses', 'shovels']);
      });

      it('shows both entity lists used and updated by the form', async () => {
        testData.extendedForms.createPast(1);
        testData.formDatasetDiffs.createPast(1, { name: 'trees', properties: [Property.DefaultProperty] });
        testData.standardFormAttachments.createPast(1, { type: 'file', name: 'shovels.csv', datasetExists: true });
        const app = await load('/projects/1/forms/f/settings');
        const buttons = app.findAllComponents(Infonav);
        buttons.length.should.equal(2);
        buttons[0].get('button').text().should.equal('2 Related Entity Lists');
        buttons[0].findAll('.dropdown-menu > li').map(li => li.text()).should.eql(['Updates', 'trees', '', 'Uses', 'shovels']);
      });

      it('shows count of unique entity list names if the same is both used and updated by a form', async () => {
        testData.extendedForms.createPast(1);
        testData.formDatasetDiffs.createPast(1, { name: 'trees', properties: [Property.DefaultProperty] });
        testData.standardFormAttachments.createPast(1, { type: 'file', name: 'trees.csv', datasetExists: true });
        const app = await load('/projects/1/forms/f/settings');
        const buttons = app.findAllComponents(Infonav);
        buttons.length.should.equal(2);
        buttons[0].get('button').text().should.equal('1 Related Entity List');
        buttons[0].findAll('.dropdown-menu > li').map(li => li.text()).should.eql(['Updates', 'trees', '', 'Uses', 'trees']);
      });
    });
  });

  describe('tabs', () => {
    it('shows all tabs to an administrator', () => {
      mockLogin();
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return load('/projects/1/forms/f/submissions').then(app => {
        const tabs = app.findAll('#page-head-tabs a');
        tabs.map(tab => textWithout(tab, '.badge')).should.eql([
          'Submissions',
          'Public Access',
          'Versions',
          'Edit Form',
          'Settings'
        ]);
      });
    });

    it('shows only select tabs to a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return load('/projects/1/forms/f/submissions').then(app => {
        const tabs = app.findAll('#page-head-tabs a');
        const text = tabs.map(tab => textWithout(tab, '.badge'));
        text.should.eql(['Submissions', 'Versions']);
      });
    });

    it('disables tabs for a form without a published version', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true });
      const app = await load('/projects/1/forms/f/draft');
      const tabs = app.findAll('#page-head-tabs li');
      tabs.length.should.equal(5);
      for (const tab of tabs) {
        if (tab.text() === 'Edit Form') continue; // eslint-disable-line no-continue
        tab.classes('disabled').should.be.true;
        const a = tab.get('a');
        a.should.have.ariaDescription('Publish this Draft Form to enable these functions');
        await a.should.have.tooltip();
      }
    });

    it('does not disable tabs for a form with a published version', async () => {
      mockLogin();
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      const app = await load('/projects/1/forms/f/draft');
      const tabs = app.findAll('#page-head-tabs li');
      tabs.length.should.equal(5);
      for (const tab of tabs) {
        tab.classes('disabled').should.be.false;
        const a = tab.get('a');
        a.should.not.have.ariaDescription();
        await a.should.not.have.tooltip();
      }
    });

    it('shows the count of submissions', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { submissions: 1000 });
      const app = await load('/projects/1/forms/f/settings');
      findTab(app, 'Submissions').get('.badge').text().should.equal('1,000');
    });

    it('shows the number of active public links', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { publicLinks: 1000 });
      const app = await load('/projects/1/forms/f/settings');
      findTab(app, 'Public Access').get('.badge').text().should.equal('1,000');
    });

    it('shows the form state', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { state: 'closing' });
      const app = await load('/projects/1/forms/f/settings');
      findTab(app, 'Settings').get('.badge').text().should.equal('Closing');
    });
  });
});
