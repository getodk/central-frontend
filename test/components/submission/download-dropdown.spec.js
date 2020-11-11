import sinon from 'sinon';

import Form from '../../../src/presenters/form';
import SubmissionDownloadDropdown from '../../../src/components/submission/download-dropdown.vue';
import testData from '../../data';
import { mount } from '../../util/lifecycle';
import { trigger } from '../../util/event';

const mountComponent = () => {
  const formVersion = testData.extendedForms.last();
  return mount(SubmissionDownloadDropdown, {
    propsData: {
      baseUrl: '/v1/projects/1/forms/f',
      formVersion: new Form(formVersion)
    },
    requestData: {
      fields: formVersion._fields,
      keys: testData.standardKeys.sorted()
    }
  });
};

describe('SubmissionDownloadDropdown', () => {
  describe('button text', () => {
    it('shows the correct text if there are no submissions', () => {
      testData.extendedForms.createPast(1, { submissions: 0 });
      const text = mountComponent().first('button').text().trim();
      text.should.equal('Download all records');
    });

    it('shows the correct text if there is 1 submission', () => {
      testData.extendedForms.createPast(1, { submissions: 1 });
      const text = mountComponent().first('button').text().trim();
      text.should.equal('Download all records');
    });

    it('shows the correct text if there are 2 submissions', () => {
      testData.extendedForms.createPast(1, { submissions: 2 });
      const text = mountComponent().first('button').text().trim();
      text.should.equal('Download all 2 records');
    });
  });

  describe('form does not have a managed key', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1, { key: null });
    });

    it('sets the correct href attributes', () => {
      testData.extendedForms.createPast(1);
      mountComponent().find('a').map(a => a.getAttribute('href')).should.eql([
        '/v1/projects/1/forms/f/submissions.csv.zip',
        '/v1/projects/1/forms/f/submissions.csv.zip?media=false',
        '/v1/projects/1/forms/f/submissions.csv'
      ]);
    });

    it('sets the target attribute to _blank', () => {
      testData.extendedForms.createPast(1);
      mountComponent().find('a').should.matchEach(a =>
        a.getAttribute('target') === '_blank');
    });

    describe('form does not have a binary field', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, {
          fields: [{ path: '/i', type: 'int' }]
        });
      });

      it('disables the "without media" link', () => {
        mountComponent().find('li')[1].hasClass('disabled').should.be.true();
      });

      it('prevents default', () => {
        const a = mountComponent().find('a')[1];
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        });
        a.element.dispatchEvent(event).should.be.false();
      });
    });
  });

  describe('form has a managed key', () => {
    beforeEach(() => {
      const key = testData.standardKeys.createPast(1, { managed: true }).last();
      testData.extendedProjects.createPast(1, { key });
    });

    it('emits a decrypt event for the "with media" link', () => {
      testData.extendedForms.createPast(1);
      const dropdown = mountComponent();
      const $emit = sinon.fake();
      sinon.replace(dropdown.vm, '$emit', $emit);
      trigger.click(dropdown, 'a');
      $emit.getCall(0).args.should.eql([
        'decrypt',
        '/v1/projects/1/forms/f/submissions.csv.zip'
      ]);
    });

    it('emits a decrypt event for the "without media" link', () => {
      testData.extendedForms.createPast(1, {
        fields: [{ path: '/b', type: 'binary', binary: true }]
      });
      const dropdown = mountComponent();
      const $emit = sinon.fake();
      sinon.replace(dropdown.vm, '$emit', $emit);
      trigger.click(dropdown.find('a')[1]);
      $emit.getCall(0).args.should.eql([
        'decrypt',
        '/v1/projects/1/forms/f/submissions.csv.zip?media=false'
      ]);
    });

    it('emits a decrypt event for the "primary data table" link', () => {
      testData.extendedForms.createPast(1);
      const dropdown = mountComponent();
      const $emit = sinon.fake();
      sinon.replace(dropdown.vm, '$emit', $emit);
      trigger.click(dropdown.find('a')[2]);
      $emit.getCall(0).args.should.eql([
        'decrypt',
        '/v1/projects/1/forms/f/submissions.csv'
      ]);
    });

    it('prevents default', () => {
      testData.extendedForms.createPast(1);
      const a = mountComponent().first('a');
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      a.element.dispatchEvent(event).should.be.false();
    });

    it('does not set the target attribute', () => {
      testData.extendedForms.createPast(1);
      mountComponent().find('a').should.matchEach(a =>
        !a.hasAttribute('target'));
    });

    describe('form does not have a binary field', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, {
          fields: [{ path: '/i', type: 'int' }]
        });
      });

      it('disables the "without media" link', () => {
        mountComponent().find('li')[1].hasClass('disabled').should.be.true();
      });

      it('does not emit a decrypt event', () => {
        const dropdown = mountComponent();
        const $emit = sinon.fake();
        sinon.replace(dropdown.vm, '$emit', $emit);
        trigger.click(dropdown.find('a')[1]);
        $emit.called.should.be.false();
      });
    });
  });
});
