import DateTime from '../../../src/components/date-time.vue';
import EnketoFill from '../../../src/components/enketo/fill.vue';
import EnketoPreview from '../../../src/components/enketo/preview.vue';
import FormRow from '../../../src/components/form/row.vue';
import LinkIfCan from '../../../src/components/link-if-can.vue';

import Form from '../../../src/presenters/form';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(FormRow, {
  props: { form: new Form(testData.extendedForms.last()) },
  container: {
    requestData: {
      forms: testData.extendedForms.sorted(),
      project: testData.extendedProjects.last()
    },
    router: mockRouter('/projects/1')
  }
});

describe('FormRow', () => {
  describe('form name', () => {
    beforeEach(mockLogin);

    it("shows the form's name if it has one", () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', name: 'My Form', state: 'open' });
      mountComponent().get('.name a').text().should.equal('My Form');
    });

    it('shows the xmlFormId if the form does not have a name', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', name: null, state: 'open' });
      mountComponent().get('.name a').text().should.equal('f');
    });
  });

  describe('form link', () => {
    describe('administrator', () => {
      beforeEach(mockLogin);

      it('links to form overview for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 2, state: 'open' });
        const links = mountComponent().findAllComponents(LinkIfCan);
        links.length.should.equal(6);
        links[0].props().to.should.equal('/projects/1/forms/a%20b');
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
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', state: 'open' });
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
        testData.extendedForms.createPast(1, { name: 'My Form', state: 'open' });
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
  });

  describe('submission date and counts', () => {
    beforeEach(mockLogin);

    it('shows the date', () => {
      const lastSubmission = new Date().toISOString();
      testData.extendedForms.createPast(1, { lastSubmission, state: 'open' });
      const row = mountComponent();
      const text = row.get('.last-submission').text();
      text.should.match(/ago$/);
      const dateTimes = row.findAllComponents(DateTime);
      dateTimes.length.should.equal(1);
      dateTimes[0].props().iso.should.equal(lastSubmission);
    });

    it('does not render date if there have been no submissions', () => {
      testData.extendedForms.createPast(1, { state: 'open', submissions: 0 });
      mountComponent().get('.last-submission').text().should.equal('(none)');
    });

    it('shows the submission count', () => {
      testData.extendedForms.createPast(1, { state: 'open', submissions: 12345 });
      const text = mountComponent().get('.total-submissions').text();
      text.should.equal('12,345');
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
        columns.map((col) => col.get('a').props().to).should.eql([
          '/projects/1/forms/a%20b/submissions?reviewState=null',
          '/projects/1/forms/a%20b/submissions?reviewState=%27hasIssues%27',
          '/projects/1/forms/a%20b/submissions?reviewState=%27edited%27']);
      });

      it('last submission has the correct links', () => {
        const link = mountComponent().get('.last-submission a');
        link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
      });

      it('submission count links to the right place', () => {
        const link = mountComponent().get('.total-submissions a');
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
        columns.map((col) => col.get('a').props().to).should.eql([
          '/projects/1/forms/a%20b/submissions?reviewState=null',
          '/projects/1/forms/a%20b/submissions?reviewState=%27hasIssues%27',
          '/projects/1/forms/a%20b/submissions?reviewState=%27edited%27']);
      });

      it('last submission has the correct links', () => {
        const link = mountComponent().get('.last-submission a');
        link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
      });

      it('submission count links to the right place', () => {
        const link = mountComponent().get('.total-submissions a');
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
        columns.map((col) => col.get('a').props().to).should.eql([
          '/projects/1/forms/a%20b/submissions?reviewState=null',
          '/projects/1/forms/a%20b/submissions?reviewState=%27hasIssues%27',
          '/projects/1/forms/a%20b/submissions?reviewState=%27edited%27']);
      });

      it('last submission has the correct links', () => {
        const link = mountComponent().get('.last-submission a');
        link.props().to.should.equal('/projects/1/forms/a%20b/submissions');
      });

      it('submission count links to the right place', () => {
        const link = mountComponent().get('.total-submissions a');
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
      testData.extendedForms.createPast(1, { draft: true });
      const row = mountComponent();
      row.findComponent(EnketoPreview).exists().should.be.false();
      row.findComponent(EnketoFill).exists().should.be.false();
    });

    // TODO: change right above test to check for preview link
    // TODO: Test closed form behavior (doesnt show any action)
    // TODO: check that test that is closing says that and doesn't have button
  });
});
