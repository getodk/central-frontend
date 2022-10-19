import { RouterLinkStub } from '@vue/test-utils';

import ProjectFormRow from '../../../src/components/project/form-row.vue';
import DateTime from '../../../src/components/date-time.vue';

import useProjects from '../../../src/request-data/projects';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => {
  const projectData = { ...testData.extendedProjects.last() };
  projectData.formList = testData.extendedForms.sorted();
  const container = createTestContainer({
    requestData: testRequestData([useProjects], { projects: [projectData] }),
    router: mockRouter('/')
  });
  const project = container.requestData.localResources.projects[0];
  return mount(ProjectFormRow, {
    props: { form: project.formList[0], project },
    container
  });
};

describe('ProjectFormRow', () => {
  describe('form name', () => {
    beforeEach(mockLogin);

    it('renders the form name correctly', () => {
      testData.extendedForms.createPast(1, { name: 'My Form', xmlFormId: 'f' });
      const link = mountComponent().find('.form-name a');
      link.text().should.equal('My Form');
    });

    it('shows the xmlFormId if the form does not have a name', () => {
      testData.extendedForms.createPast(1, { name: null, xmlFormId: 'f' });
      const link = mountComponent().getComponent(RouterLinkStub);
      link.text().should.equal('f');
    });
  });

  describe('form link', () => {
    describe('Administrator', () => {
      beforeEach(mockLogin);

      it('links to form overview for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        const link = mountComponent().getComponent('.form-name a');
        link.props().to.should.equal('/projects/1/forms/a%20b');
      });

      it('links to .../draft for a form without a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
        const link = mountComponent().getComponent('.form-name a');
        link.props().to.should.equal('/projects/1/forms/a%20b/draft');
      });
    });

    describe('Project Manager', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'manager', forms: 1 });
      });

      it('links to form overview for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        const link = mountComponent().getComponent('.form-name a');
        link.props().to.should.equal('/projects/1/forms/a%20b');
      });

      it('links to .../draft for a form without a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
        const link = mountComponent().getComponent('.form-name a');
        link.props().to.should.equal('/projects/1/forms/a%20b/draft');
      });
    });

    describe('Project Viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      });

      it('links to .../submissions for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        const link = mountComponent().getComponent('.form-name a');
        link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
      });

      // draft forms not shown in project-form-row to project viewers
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
        link.attributes().href.should.equal('/-/xyz');
      });

      it('does not render a link to enketo if closed', () => {
        testData.extendedForms.createPast(1, { name: 'My Form', enketoId: 'xyz', state: 'closed' });
        const row = mountComponent();
        const name = row.get('.form-name');
        name.find('a').exists().should.be.false();
        name.text().should.equal('My Form');
      });

      it('does not render a link if enketo not ready for this form', () => {
        testData.extendedForms.createPast(1, { name: 'My Form', enketoId: null, state: 'open' });
        const row = mountComponent();
        const name = row.get('.form-name');
        name.find('a').exists().should.be.false();
        name.text().should.equal('My Form');
      });

      // draft forms not shown in project-form-row to data collectors
    });
  });

  describe('review state counts', () => {
    beforeEach(mockLogin);

    it('shows the correct counts and icons for each review state', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: { received: 2345, hasIssues: 1, edited: 3 } });
      const columns = mountComponent().findAll('.review-state');
      columns.length.should.equal(3);
      columns.map((col) => col.get('a').text()).should.eql(['2,345', '1', '3']);
      columns[0].find('.icon-dot-circle-o').exists().should.be.true();
      columns[1].find('.icon-comments').exists().should.be.true();
      columns[2].find('.icon-pencil').exists().should.be.true();
      columns[0].find('span').attributes().title.should.equal('Received');
      columns[1].find('span').attributes().title.should.equal('Has issues');
      columns[2].find('span').attributes().title.should.equal('Edited');
    });

    it('shows blank review state columns when the form is a draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      const row = mountComponent();
      row.findAll('.review-state').length.should.equal(0);
    });
  });

  describe('last submission', () => {
    beforeEach(mockLogin);

    it('shows the correct time since the last submission', () => {
      const lastSubmission = new Date().toISOString();
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', lastSubmission });
      const row = mountComponent();
      row.find('.last-submission').text().should.match(/ago$/);
      const dateTimes = row.findAllComponents(DateTime);
      dateTimes.length.should.equal(1);
      dateTimes[0].props().iso.should.equal(lastSubmission);
    });

    it('shows the correct icon', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 4 });
      const cell = mountComponent().find('.last-submission');
      cell.find('.icon-clock-o').exists().should.be.true();
      cell.find('span').attributes().title.should.equal('Latest Submission');
    });

    it('shows (none) if no submission', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 0 });
      mountComponent().find('.last-submission').text().should.equal('(none)');
    });

    it('shows blank last submission column when the form is a draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      mountComponent().find('.last-submission').exists().should.be.false();
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
      row.find('.total-submissions').exists().should.be.false();
      row.find('.not-published').text().should.equal('Not published yet');
    });

    it('shows the correct icon', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 4 });
      const cell = mountComponent().find('.total-submissions');
      cell.find('.icon-asterisk').exists().should.be.true();
      cell.find('span').attributes().title.should.equal('Total');
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
          col.find('a').exists().should.be.false();
          col.text().should.equal('2');
        }
      });

      it('does not render a link for last submission', () => {
        const nonLink = mountComponent().get('.last-submission');
        nonLink.find('a').exists().should.be.false();
        nonLink.text().should.match(/ago$/);
      });

      it('does not render a link for submission count', () => {
        const nonLink = mountComponent().get('.total-submissions');
        nonLink.find('a').exists().should.be.false();
        nonLink.text().should.equal('6');
      });
    });
  });
});
