import DateTime from '../../../src/components/date-time.vue';
import FormTrashRow from '../../../src/components/form/trash-row.vue';

import Form from '../../../src/presenters/form';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = (formData) => mount(FormTrashRow, {
  propsData: { form: new Form(formData) },
  container: {
    requestData: { forms: testData.extendedForms.sorted() }
  }
});

describe('FormTrashRow', () => {
  describe('form name and deleted timestamp', () => {
    beforeEach(mockLogin);

    it('shows the form name if it has one', () => {
      const formData = { xmlFormId: 'f', name: 'My Form' };
      mountComponent(formData).get('.form-name').text().should.equal('My Form');
    });

    it('shows the xmlFormId if the form does not have a name', () => {
      const formData = { xmlFormId: 'f', name: null };
      mountComponent(formData).get('.form-name').text().should.equal('f');
    });

    it('shows the deleted timestamp', () => {
      const deletedDate = new Date().toISOString();
      const formData = { xmlFormId: 'f', name: null, deletedAt: deletedDate };
      const row = mountComponent(formData);
      row.get('.deleted-date').text().should.match(/^Deleted .+$/);
      const dateTime = row.findAllComponents(DateTime);
      dateTime.length.should.equal(1);
      dateTime.at(0).props().iso.should.equal(deletedDate);
    });
  });

  describe('form id and version', () => {
    beforeEach(mockLogin);

    it('shows the xmlFormId', () => {
      const formData = { xmlFormId: 'f' };
      mountComponent(formData).get('.form-id').text().should.equal('f');
    });

    it('shows the version string', () => {
      const formData = { version: 'v1' };
      mountComponent(formData).get('.version').text().should.equal('v1');
    });

    it('does not render the version string if it is empty', () => {
      const formData = { version: '' };
      mountComponent(formData).find('.version').exists().should.be.false();
    });
  });

  describe('last submission count and date', () => {
    beforeEach(mockLogin);

    it('shows the submission count', () => {
      const formData = { submissions: 12345 };
      const text = mountComponent(formData).get('.submissions div').text();
      text.should.equal('12,345 Submissions');
    });

    it('shows the date', () => {
      const lastSubmission = new Date().toISOString();
      const formData = { submissions: 1, lastSubmission };
      const row = mountComponent(formData);
      const divs = row.findAll('.submissions div');
      divs.length.should.equal(2); // submission count and last submission timestamp
      divs.at(1).text().should.match(/^\(last .+\)$/);
      const dateTimes = row.findAllComponents(DateTime);
      dateTimes.length.should.equal(2); // deleted timestamp and last submission timestamp
      dateTimes.at(1).props().iso.should.equal(lastSubmission);
    });

    it('does not render date if there is no last submission', () => {
      const formData = { submissions: 0 };
      mountComponent(formData).findAll('.submissions div').length.should.equal(1);
    });
  });

  describe('actions', () => {
    beforeEach(mockLogin);

    it('shows the undelete button', () => {
      const button = mountComponent({}).get('.form-trash-row-restore-button');
      button.element.tagName.should.equal('BUTTON');
      button.element.disabled.should.be.false();
    });

    it('disables the undelete button if active form with same id exists', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'foo' });
      const button = mountComponent({ xmlFormId: 'foo' }).get('.form-trash-row-restore-button');
      button.element.tagName.should.equal('BUTTON');
      button.element.disabled.should.be.true();
      button.attributes().title.should.equal('This Form cannot be undeleted because an active Form with the same ID exists.');
    });
  });
});
