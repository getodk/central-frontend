import DateTime from '../../../src/components/date-time.vue';
import EnketoFill from '../../../src/components/enketo/fill.vue';
import EnketoPreview from '../../../src/components/enketo/preview.vue';
import FormRow from '../../../src/components/form/row.vue';
import LinkIfCan from '../../../src/components/link-if-can.vue';

import useProject from '../../../src/request-data/project';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => {
  const container = createTestContainer({
    requestData: testRequestData([useProject], {
      project: testData.extendedProjects.last(),
      forms: testData.extendedForms.sorted()
    }),
    router: mockRouter('/projects/1')
  });
  const { forms } = container.requestData.localResources;
  return mount(FormRow, {
    // additional FormRow prop `showActions` is tested through form/table.spec.js and
    // visibility of actions column by different roles
    props: { form: forms[0] },
    container
  });
};

describe('FormRow', () => {
  describe('form name', () => {
    beforeEach(mockLogin);

    it("shows the form's name if it has one", () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', name: 'My Form' });
      mountComponent().get('.name a').text().should.equal('My Form');
    });

    it('shows the xmlFormId if the form does not have a name', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', name: null });
      mountComponent().get('.name a').text().should.equal('f');
    });
  });

  describe('form link', () => {
    describe('administrator', () => {
      beforeEach(mockLogin);

      it('links to form overview for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        const { to } = mountComponent().getComponent(LinkIfCan).props();
        to.should.equal('/projects/1/forms/a%20b');
      });

      it('links to .../draft for a form without a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
        const { to } = mountComponent().getComponent(LinkIfCan).props();
        to.should.equal('/projects/1/forms/a%20b/draft');
      });
    });

    describe('project viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      });

      it('links to .../submissions for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        const { to } = mountComponent().getComponent(LinkIfCan).props();
        to.should.equal('/projects/1/forms/a%20b/submissions');
      });

      it('links to .../draft/testing for form without published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
        const { to } = mountComponent().getComponent(LinkIfCan).props();
        to.should.equal('/projects/1/forms/a%20b/draft/testing');
      });
    });

    describe('Data Collector', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
        testData.extendedForms.createPast(1, { name: 'My Form' });
      });

      it('does not render a link', () => {
        const row = mountComponent();
        const name = row.get('.name');
        name.find('a').exists().should.be.false();
        name.text().should.equal('My Form');
      });
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
      columns[0].find('a').attributes().title.should.equal('Received');
      columns[1].find('a').attributes().title.should.equal('Has issues');
      columns[2].find('a').attributes().title.should.equal('Edited');
    });

    it('shows blank review state columns when the form is a draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      const columns = mountComponent().findAll('.review-state');
      columns.length.should.equal(3);
      columns.map((col) => col.text().should.be.empty());
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
      const cell = row.find('.not-published');
      cell.text().should.equal('Not published yet');
      cell.find('.icon-asterisk').exists().should.be.true();
    });

    it('shows the correct icon', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 4 });
      const cell = mountComponent().find('.total-submissions');
      cell.find('.icon-asterisk').exists().should.be.true();
      cell.find('a').attributes().title.should.equal('Total');
    });
  });
  describe('all submission links', () => {
    describe('Administrator', () => {
      beforeEach(() => {
        mockLogin();
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

  describe('actions', () => {
    it('never shows an action for a closed form', () => {
      mockLogin();
      testData.extendedForms.createPast(1, { state: 'closed' });
      const actions = mountComponent().get('.actions');
      actions.text().should.be.empty();
    });

    it('shows the correct action (closing note but no link) for a closing form', () => {
      mockLogin();
      testData.extendedForms.createPast(1, { state: 'closing' });
      const actions = mountComponent().get('.actions');
      actions.text().should.equal('Closing');
      actions.find('.closing-icon').exists().should.be.true();
    });

    it('shows the preview button to an administrator', () => {
      mockLogin({ role: 'admin' });
      testData.extendedForms.createPast(1, { state: 'open' });
      const row = mountComponent();
      row.getComponent(EnketoPreview).should.be.visible();
      row.findComponent(EnketoFill).exists().should.be.false();
    });

    it('shows the "Fill Form" button to a Data Collector', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
      testData.extendedForms.createPast(1, { state: 'open' });
      const row = mountComponent();
      row.getComponent(EnketoFill).should.be.visible();
      row.findComponent(EnketoPreview).exists().should.be.false();
    });

    it('does not render preview button for form without published version', () => {
      mockLogin();
      testData.extendedForms.createPast(1, { state: 'open', draft: true });
      const row = mountComponent();
      row.findComponent(EnketoPreview).exists().should.be.false();
      row.findComponent(EnketoFill).exists().should.be.false();
    });

    it('shows a "Test" button to admin on non-published version', () => {
      mockLogin();
      testData.extendedForms.createPast(1, { state: 'open', draft: true });
      const actions = mountComponent().find('.actions');
      actions.text().should.equal('Test');
      actions.find('.icon-pencil').exists().should.be.true();
      actions.getComponent('a').props().to.should.equal('/projects/1/forms/f/draft/testing');
    });
  });
});
