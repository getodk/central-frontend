import { RouterLinkStub } from '@vue/test-utils';

import DateTime from '../../../src/components/date-time.vue';
import EnketoFill from '../../../src/components/enketo/fill.vue';
import EnketoPreview from '../../../src/components/enketo/preview.vue';
import FormRow from '../../../src/components/form/row.vue';
import FormTable from '../../../src/components/form/table.vue';
import LinkIfCan from '../../../src/components/link-if-can.vue';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = () => {
  // Mounting FormTable rather than FormRow in order not to mock the `columns`
  // prop of FormRow.
  const table = mount(FormTable, {
    requestData: {
      project: testData.extendedProjects.last(),
      forms: testData.extendedForms.sorted()
    },
    stubs: { RouterLink: RouterLinkStub },
    mocks: { $route: '/projects/1' }
  });
  return table.getComponent(FormRow);
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

    it('shows ban icon and grayed out form name link for closed form', () => {
      testData.extendedForms.createPast(1, { state: 'closed' });
      const a = mountComponent().get('.name a');
      a.find('.icon-ban').exists().should.be.true();
      const { title } = a.get('.form-icon').attributes();
      title.should.equal('This Form is Closed. It is not downloadable and does not accept Submissions.');
      a.find('.form-name-closed').exists().should.be.true();
    });

    it('shows clock icon in form name link for closing form', () => {
      testData.extendedForms.createPast(1, { state: 'closing' });
      const a = mountComponent().get('.name a');
      a.find('.icon-clock-o').exists().should.be.true();
      const { title } = a.get('.form-icon').attributes();
      title.should.equal('This Form is Closing. It is not downloadable but still accepts Submissions.');
    });

    it('shows edit/pencil icon for unpublished draft form', () => {
      testData.extendedForms.createPast(1, { draft: true });
      const a = mountComponent().get('.name a');
      a.find('.icon-edit').exists().should.be.true();
      const { title } = a.get('.form-icon').attributes();
      title.should.equal('This Form does not yet have a published version.');
    });
  });

  describe('form link', () => {
    describe('administrator', () => {
      beforeEach(mockLogin);

      it('links to form overview for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        const links = mountComponent().findAllComponents(LinkIfCan);
        links.length.should.equal(1);
        links.at(0).props().to.should.equal('/projects/1/forms/a%20b');
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

  it('shows the xmlFormId', () => {
    mockLogin();
    testData.extendedForms.createPast(1, { xmlFormId: 'f' });
    mountComponent().get('.form-id').text().should.equal('f');
  });

  describe('version string', () => {
    beforeEach(mockLogin);

    it('shows the version string', () => {
      testData.extendedForms.createPast(1, { version: 'v1' });
      mountComponent().get('.version').text().should.equal('v1');
    });

    it('does not render the version string if it is empty', () => {
      testData.extendedForms.createPast(1, { version: '' });
      mountComponent().find('.version').exists().should.be.false();
    });

    it('does not render version string for form without published version', () => {
      testData.extendedForms.createPast(1, { draft: true, version: 'v1' });
      mountComponent().find('.version').exists().should.be.false();
    });
  });

  it('shows the submission count', () => {
    mockLogin();
    testData.extendedForms.createPast(1, { submissions: 12345 });
    const text = mountComponent().get('.submissions div').text();
    text.should.equal('12,345 Submissions');
  });

  describe('last submission date', () => {
    beforeEach(mockLogin);

    it('shows the date', () => {
      const lastSubmission = new Date().toISOString();
      testData.extendedForms.createPast(1, { lastSubmission });
      const row = mountComponent();
      const divs = row.findAll('.submissions div');
      divs.length.should.equal(2);
      divs.at(1).text().should.match(/^\(last .+\)$/);
      const dateTimes = row.findAllComponents(DateTime);
      dateTimes.length.should.equal(1);
      dateTimes.at(0).props().iso.should.equal(lastSubmission);
    });

    it('does not render date if there have been no submissions', () => {
      testData.extendedForms.createPast(1, { submissions: 0 });
      mountComponent().findAll('.submissions div').length.should.equal(1);
    });
  });

  describe('submissions link', () => {
    beforeEach(mockLogin);

    it('links to .../submissions for a form with a published version', () => {
      testData.extendedForms.createPast(1, {
        xmlFormId: 'a b',
        submissions: 1
      });
      const links = mountComponent().findAllComponents(RouterLinkStub)
        .filter(link => link.element.closest('.submissions') != null);
      links.length.should.equal(2);
      const to = links.wrappers.map(link => link.props().to);
      to.should.matchEach('/projects/1/forms/a%20b/submissions');
    });

    it('shows a blank submission column for a form without a published version', () => {
      testData.extendedForms.createPast(1, {
        xmlFormId: 'a b',
        draft: true,
        submissions: 1
      });
      // Since the form does not have a published version, it does not have
      // submissions to show (draft submissions are possible, but not shown here)
      mountComponent().find('.submissions a').exists().should.be.false();
    });
  });

  describe('actions', () => {
    it('shows the preview button to an administrator', () => {
      mockLogin({ role: 'admin' });
      testData.extendedForms.createPast(1);
      const row = mountComponent();
      row.getComponent(EnketoPreview).should.be.visible();
      row.findComponent(EnketoFill).exists().should.be.false();
    });

    it('shows the "Fill Form" button to a Data Collector', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
      testData.extendedForms.createPast(1);
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
  });
});
