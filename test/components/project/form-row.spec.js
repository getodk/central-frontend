import ProjectFormRow from '../../../src/components/project/form-row.vue';
import LinkIfCan from '../../../src/components/link-if-can.vue';
import DateTime from '../../../src/components/date-time.vue';

import Form from '../../../src/presenters/form';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(ProjectFormRow, {
  props: {
    form: new Form(testData.extendedForms.last())
  },
  container: { router: mockRouter('/projects/1') }
});

describe('ProjectFormRow', () => {
  describe('form name', () => {
    beforeEach(mockLogin);

    it('renders the form name correctly', () => {
      testData.extendedForms.createPast(1, { name: 'My Form', xmlFormId: 'f', reviewStates: {} });
      const link = mountComponent().getComponent(LinkIfCan);
      link.text().should.equal('My Form');
      link.props().to.should.equal('/projects/1/forms/f');
    });

    it('shows the xmlFormId if the form does not have a name', () => {
      testData.extendedForms.createPast(1, { name: null, xmlFormId: 'f', reviewStates: {} });
      const link = mountComponent().getComponent(LinkIfCan);
      link.text().should.equal('f');
    });

    // TODO: in tests and in code
    // figure out how to indicate closed forms
  });

  describe('form link', () => {
    describe('Administrator', () => {
      beforeEach(mockLogin);

      it('links to form overview for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: {} });
        const links = mountComponent().findAllComponents(LinkIfCan);
        links.length.should.equal(1);
        links[0].props().to.should.equal('/projects/1/forms/a%20b');
      });

      it('links to .../draft for a form without a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true, reviewStates: {} });
        const { to } = mountComponent().getComponent(LinkIfCan).props();
        to.should.equal('/projects/1/forms/a%20b/draft');
      });
    });

    describe('Project Manager', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'manager', forms: 1 });
      });

      it('links to form overview for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: {} });
        const links = mountComponent().findAllComponents(LinkIfCan);
        links.length.should.equal(1);
        links[0].props().to.should.equal('/projects/1/forms/a%20b');
      });

      it('links to .../draft for a form without a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true, reviewStates: {} });
        const { to } = mountComponent().getComponent(LinkIfCan).props();
        to.should.equal('/projects/1/forms/a%20b/draft');
      });
    });

    describe('Project Viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      });

      it.skip('links to .../submissions for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: {} });
        const { to } = mountComponent().getComponent(LinkIfCan).props();
        to.should.equal('/projects/1/forms/a%20b/submissions');
        // TODO: change link to go directly to submissions
      });

      // draft forms not shown in project-form-row to project viewers
    });

    describe('Data Collector', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
        testData.extendedForms.createPast(1, { name: 'My Form', reviewStates: {} });
      });

      it.skip('does not render a link', () => {
        const row = mountComponent();
        const name = row.get('.name');
        name.find('a').exists().should.be.false();
        name.text().should.equal('My Form');
        // TODO: what should a form link to if the user is a data collector???
      });
    });
  });

  describe('review states', () => {
    beforeEach(mockLogin);

    it('shows the correct counts for each review state', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: { received: 2345, hasIssues: 1, edited: 3 } });
      const columns = mountComponent().findAll('.review-state');
      columns.length.should.equal(3);
      columns.map((col) => col.get('a').text()).should.eql(['2,345', '1', '3']);
    });

    // TODO: check each icon

    it('links to the correct filtered submissions for each review state', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: { received: 2, hasIssues: 1, edited: 3 } });
      const columns = mountComponent().findAll('.review-state');
      columns.length.should.equal(3);
      columns.map((col) => col.get('a').props().to).should.eql([
        '/projects/1/forms/a%20b/submissions?reviewState=null',
        '/projects/1/forms/a%20b/submissions?reviewState=%27hasIssues%27',
        '/projects/1/forms/a%20b/submissions?reviewState=%27edited%27']);
    });

    it('shows blank review state columns when the form is a draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: {}, draft: true });
      const row = mountComponent();
      row.findAll('.review-state').length.should.equal(0);
    });
  });


  describe('last submission', () => {
    beforeEach(mockLogin);

    it('shows the correct time since the last submission', () => {
      const lastSubmission = new Date().toISOString();
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: {}, lastSubmission });
      const row = mountComponent();
      row.find('.last-submission div').text().should.match(/ago$/);
      const dateTimes = row.findAllComponents(DateTime);
      dateTimes.length.should.equal(1);
      dateTimes[0].props().iso.should.equal(lastSubmission);
    });

    it('shows (none) if no submission', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: {}, submissions: 0 });
      mountComponent().find('.last-submission div').text().should.equal('(none)');
    });

    it('shows blank last submission column when the form is a draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: {}, draft: true });
      mountComponent().find('.last-submission div').exists().should.be.false();
    });

    it('has the correct links', () => {
      const lastSubmission = new Date().toISOString();
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: {}, lastSubmission });
      const link = mountComponent().get('.last-submission div a');
      link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
    });

    // TODO: has clock icon
  });

  describe('submission count', () => {
    beforeEach(mockLogin);

    it('shows the correct count for all submissions', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: {}, submissions: 1234 });
      mountComponent().find('.total-submissions').text().should.equal('1,234');
    });

    it('shows "not published yet" when form is a draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: {}, draft: true });
      const row = mountComponent();
      row.find('.total-submissions').exists().should.be.false();
      row.find('.not-published').text().should.equal('Not published yet');
    });

    it('links to the right place', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', reviewStates: {}, submissions: 3 });
      const link = mountComponent().get('.total-submissions a');
      link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
    });

    // TODO: astrisk icon
  });
});
