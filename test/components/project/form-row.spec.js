import ProjectFormRow from '../../../src/components/project/form-row.vue';
import DateTime from '../../../src/components/date-time.vue';
import FormLink from '../../../src/components/form/link.vue';

import useProjects from '../../../src/request-data/projects';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { setLuxon } from '../../util/date-time';
import { testRequestData } from '../../util/request-data';

const mountComponent = (showIcon = false) => {
  const projectData = { ...testData.extendedProjects.last() };
  projectData.formList = testData.extendedForms.sorted();
  const container = createTestContainer({
    requestData: testRequestData([useProjects], { projects: [projectData] }),
    router: mockRouter('/')
  });
  const project = container.requestData.localResources.projects[0];
  return mount(ProjectFormRow, {
    props: { form: project.formList[0], project, showIcon },
    container
  });
};

describe('ProjectFormRow', () => {
  describe('form link', () => {
    it('renders a FormLink for a sitewide administrator', () => {
      mockLogin();
      testData.extendedForms.createPast(1);
      const link = mountComponent().get('.form-name').getComponent(FormLink);
      link.props().form.xmlFormId.should.equal('f');
      link.props().to.should.equal('/projects/1/forms/f/submissions');
    });

    it('renders a FormLink for a project manager', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'manager', forms: 1 });
      testData.extendedForms.createPast(1);
      const link = mountComponent().get('.form-name').getComponent(FormLink);
      link.props().form.xmlFormId.should.equal('f');
      link.props().to.should.equal('/projects/1/forms/f/submissions');
    });

    // Note that draft forms are not shown in ProjectFormRow to project viewers.
    it('renders a FormLink for a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1);
      const link = mountComponent().get('.form-name').getComponent(FormLink);
      link.props().form.xmlFormId.should.equal('f');
      link.props().to.should.equal('/projects/1/forms/f/submissions');
    });

    it('links to the draft status page for a draft form', () => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true });
      const link = mountComponent().get('.form-name').getComponent(FormLink);
      should.not.exist(link.props().to);
    });

    describe('Data Collector', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
      });

      it('links to enketo form fill if form is open', () => {
        testData.extendedForms.createPast(1, { name: 'My Form', enketoId: 'xyz', state: 'open' });
        const row = mountComponent();
        const link = row.get('.form-name a');
        link.text().should.equal('My Form');
        link.attributes().href.should.equal('/projects/1/forms/f/submissions/new');
      });

      it('does not render a link to enketo if closed', () => {
        testData.extendedForms.createPast(1, { name: 'My Form', enketoId: 'xyz', state: 'closed' });
        const row = mountComponent();
        const name = row.get('.form-name');
        name.find('a').exists().should.be.false;
        name.text().should.equal('My Form');
      });

      it('does not render a link if enketo not ready for this form', () => {
        testData.extendedForms.createPast(1, { name: 'My Form', enketoId: null, state: 'open' });
        const row = mountComponent();
        const name = row.get('.form-name');
        name.find('a').exists().should.be.false;
        name.text().should.equal('My Form');
      });

      // draft forms not shown in project-form-row to data collectors
    });
  });

  describe('review state counts', () => {
    beforeEach(mockLogin);

    it('shows the correct counts and icons for each review state', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: { received: 2345, hasIssues: 1, edited: 3 } });
      const columns = mountComponent().findAll('.review-state');
      columns.length.should.equal(3);
      columns.map((col) => col.get('a').text()).should.eql(['2,345', '1', '3']);
      columns[0].find('.icon-dot-circle-o').exists().should.be.true;
      columns[1].find('.icon-comments').exists().should.be.true;
      columns[2].find('.icon-pencil').exists().should.be.true;
      await columns[0].get('span').should.have.tooltip('Received');
      await columns[1].get('span').should.have.tooltip('Has issues');
      await columns[2].get('span').should.have.tooltip('Edited');
    });

    it('shows blank review state columns when the form is a draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      const row = mountComponent();
      row.findAll('.review-state').length.should.equal(0);
    });
  });

  describe('last submission', () => {
    beforeEach(mockLogin);

    it('shows the correct time since the last submission', async () => {
      setLuxon({ defaultZoneName: 'UTC' });
      const lastSubmission = '2023-01-01T00:00:00Z';
      testData.extendedForms.createPast(1, { lastSubmission });
      const span = mountComponent().get('.last-submission span');
      span.text().should.match(/ago$/);
      const dateTime = span.getComponent(DateTime);
      dateTime.props().iso.should.equal(lastSubmission);
      await span.should.have.tooltip('Latest Submission\n2023/01/01 00:00:00');
      await dateTime.should.not.have.tooltip();
    });

    it('shows the correct icon', () => {
      testData.extendedForms.createPast(1, { submissions: 4 });
      const cell = mountComponent().get('.last-submission');
      cell.find('.icon-clock-o').exists().should.be.true;
    });

    it('shows (none) if no submission', async () => {
      testData.extendedForms.createPast(1, { submissions: 0 });
      const span = mountComponent().get('.last-submission span');
      span.text().should.equal('(none)');
      await span.should.have.tooltip('Latest Submission');
    });

    it('shows blank last submission column when the form is a draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      mountComponent().find('.last-submission').exists().should.be.false;
    });
  });

  describe('submission count', () => {
    beforeEach(mockLogin);

    it('shows the correct count for all submissions', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 1234 });
      mountComponent().find('.total-submissions').text().should.equal('1,234');
    });

    it('shows "not published yet" when form is a draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      const row = mountComponent();
      row.find('.total-submissions').exists().should.be.false;
      row.find('.not-published').text().should.equal('Not published yet');
    });

    it('shows the correct icon', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 4 });
      const cell = mountComponent().find('.total-submissions');
      cell.find('.icon-asterisk').exists().should.be.true;
      await cell.get('span').should.have.tooltip('Total Submissions');
    });
  });

  describe('all submission links', () => {
    describe('Administrator', () => {
      beforeEach(() => {
        mockLogin();
        const lastSubmission = new Date().toISOString();
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: { received: 2, hasIssues: 1, edited: 3 }, lastSubmission, submissions: 6 });
      });

      it('links to the correct filtered submissions for each review state', () => {
        const columns = mountComponent().findAll('.review-state');
        columns.length.should.equal(3);
        columns.map((col) => col.getComponent('a').props().to).should.eql([
          '/projects/1/forms/a%20b/submissions?reviewState=null',
          '/projects/1/forms/a%20b/submissions?reviewState=%27hasIssues%27',
          '/projects/1/forms/a%20b/submissions?reviewState=%27edited%27']);
      });

      it('last submission has the correct links', () => {
        const link = mountComponent().getComponent('.last-submission a');
        link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
      });

      it('submission count links to the right place', () => {
        const link = mountComponent().getComponent('.total-submissions a');
        link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
      });
    });

    describe('Project Manager', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'manager', forms: 1 });
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: { received: 2, hasIssues: 1, edited: 3 }, submissions: 6 });
      });

      it('links to the correct filtered submissions for each review state', () => {
        const columns = mountComponent().findAll('.review-state');
        columns.length.should.equal(3);
        columns.map((col) => col.getComponent('a').props().to).should.eql([
          '/projects/1/forms/a%20b/submissions?reviewState=null',
          '/projects/1/forms/a%20b/submissions?reviewState=%27hasIssues%27',
          '/projects/1/forms/a%20b/submissions?reviewState=%27edited%27']);
      });

      it('last submission has the correct links', () => {
        const link = mountComponent().getComponent('.last-submission a');
        link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
      });

      it('submission count links to the right place', () => {
        const link = mountComponent().getComponent('.total-submissions a');
        link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
      });
    });

    describe('Project Viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: { received: 2, hasIssues: 1, edited: 3 }, submissions: 6 });
      });

      it('links to the correct filtered submissions for each review state', () => {
        const columns = mountComponent().findAll('.review-state');
        columns.length.should.equal(3);
        columns.map((col) => col.getComponent('a').props().to).should.eql([
          '/projects/1/forms/a%20b/submissions?reviewState=null',
          '/projects/1/forms/a%20b/submissions?reviewState=%27hasIssues%27',
          '/projects/1/forms/a%20b/submissions?reviewState=%27edited%27']);
      });

      it('last submission has the correct links', () => {
        const link = mountComponent().getComponent('.last-submission a');
        link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
      });

      it('submission count links to the right place', () => {
        const link = mountComponent().getComponent('.total-submissions a');
        link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
      });
    });

    describe('Data Collector', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
        testData.extendedForms.createPast(1, { name: 'My Form', xmlFormId: 'a b', reviewStates: { received: 2, hasIssues: 2, edited: 2 }, submissions: 6 });
      });

      it('does not render a link for each review state', () => {
        const columns = mountComponent().findAll('.review-state');
        columns.length.should.equal(3);
        for (const col of columns) {
          col.find('a').exists().should.be.false;
          col.text().should.equal('2');
        }
      });

      it('does not render a link for last submission', () => {
        const nonLink = mountComponent().get('.last-submission');
        nonLink.find('a').exists().should.be.false;
        nonLink.text().should.match(/ago$/);
      });

      it('does not render a link for submission count', () => {
        const nonLink = mountComponent().get('.total-submissions');
        nonLink.find('a').exists().should.be.false;
        nonLink.text().should.equal('6');
      });
    });
  });

  describe('show icon', () => {
    beforeEach(mockLogin);

    it('should show form icon', () => {
      testData.extendedForms.createPast(1, { name: 'My Form', xmlFormId: 'f' });
      mountComponent(true).find('.col-icon span.icon-file').exists().should.be.true;
    });

    it('should not show form icon', () => {
      testData.extendedForms.createPast(1, { name: 'My Form', xmlFormId: 'f' });
      mountComponent().find('.col-icon span.icon-file').exists().should.be.false;
    });
  });
});
