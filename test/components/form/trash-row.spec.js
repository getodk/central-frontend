import DateTime from '../../../src/components/date-time.vue';
import FormTrashRow from '../../../src/components/form/trash-row.vue';

import useProject from '../../../src/request-data/project';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { setLuxon } from '../../util/date-time';
import { testRequestData } from '../../util/request-data';

const mountComponent = (deletedForm) => {
  const container = createTestContainer({
    requestData: testRequestData([useProject], {
      forms: testData.extendedForms.sorted(),
      deletedForms: [deletedForm]
    })
  });
  const { deletedForms } = container.requestData.localResources;
  return mount(FormTrashRow, {
    props: { form: deletedForms[0] },
    container
  });
};

describe('FormTrashRow', () => {
  describe('form name', () => {
    beforeEach(mockLogin);

    it('shows the form name if it has one', () => {
      const formData = { xmlFormId: 'f', name: 'My Form' };
      mountComponent(formData).get('.form-name').text().should.equal('My Form');
    });

    it('shows the xmlFormId if the form does not have a name', () => {
      const formData = { xmlFormId: 'f', name: null };
      mountComponent(formData).get('.form-name').text().should.equal('f');
    });
  });

  describe('deleted timestamp', () => {
    beforeEach(mockLogin);
    it('shows the deleted timestamp', () => {
      const deletedDate = new Date().toISOString();
      const formData = { xmlFormId: 'f', name: null, deletedAt: deletedDate };
      const row = mountComponent(formData);
      row.get('.deleted-date').text().should.match(/^Deleted .+$/);
      const dateTime = row.findAllComponents(DateTime);
      dateTime.length.should.equal(1);
      dateTime[0].props().iso.should.equal(deletedDate);
    });
  });

  describe('last submission count and date', () => {
    beforeEach(mockLogin);

    it('shows the submission count', async () => {
      const formData = { name: 'a form', submissions: 12345 };
      const cell = mountComponent(formData).get('.total-submissions');
      cell.text().should.equal('12,345');
      await cell.get('span').should.have.tooltip('Total Submissions');
    });

    it('shows the submission count when 0', () => {
      const formData = { name: 'a form', submissions: 0 };
      const text = mountComponent(formData).get('.total-submissions').text();
      text.should.equal('0');
    });

    it('shows the time since last submission', async () => {
      setLuxon({ defaultZoneName: 'UTC' });
      const lastSubmission = '2023-01-01T00:00:00Z';
      const formData = { name: 'a form', submissions: 1, lastSubmission };
      const span = mountComponent(formData).get('.last-submission span');
      span.text().should.match(/ago$/);
      const dateTime = span.getComponent(DateTime);
      dateTime.props().iso.should.equal(lastSubmission);
      await span.should.have.tooltip('Latest Submission\n2023/01/01 00:00:00');
      await dateTime.should.not.have.tooltip();
    });

    it('does not render time if there is no last submission', async () => {
      const formData = { name: 'a form', submissions: 0 };
      const span = mountComponent(formData).get('.last-submission span');
      span.text().should.equal('(none)');
      await span.should.have.tooltip('Latest Submission');
    });
  });

  describe('actions', () => {
    beforeEach(mockLogin);

    it('shows the undelete button', () => {
      const button = mountComponent({ name: 'foo' }).get('.form-trash-row-restore-button');
      button.element.tagName.should.equal('BUTTON');
      button.attributes('aria-disabled').should.equal('false');
    });

    it('disables the undelete button if active form with same id exists', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'foo' });
      const button = mountComponent({ xmlFormId: 'foo' }).get('.form-trash-row-restore-button');
      button.element.tagName.should.equal('BUTTON');
      button.attributes('aria-disabled').should.equal('true');
      button.should.have.ariaDescription('This Form cannot be undeleted because an active Form with the same ID exists.');
      await button.should.tooltip();
    });
  });
});
