import Breadcrumbs from '../../../src/components/breadcrumbs.vue';

import testData from '../../data';
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
      testData.extendedForms.createPast(1);
      const component = await load('/projects/1/forms/f/settings');
      const { links } = component.getComponent(Breadcrumbs).props();
      links.length.should.equal(2);
      links[0].path.should.equal('/projects/1');
      links[1].text.should.equal('Forms');
      links[1].path.should.equal('/projects/1');
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
