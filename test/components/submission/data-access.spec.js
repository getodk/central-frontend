import sinon from 'sinon';

import SubmissionDataAccess from '../../../src/components/submission/data-access.vue';

import Form from '../../../src/presenters/form';

import testData from '../../data';
import { mount } from '../../util/lifecycle';
import { trigger } from '../../util/event';

const mountComponent = () => mount(SubmissionDataAccess, {
  propsData: { formVersion: new Form(testData.extendedForms.last()) },
  requestData: { keys: testData.standardKeys.sorted() }
});

describe('SubmissionDataAccess', () => {
  describe('"Analyze via OData" button', () => {
    it('emits an analyze event', () => {
      testData.extendedForms.createPast(1);
      const component = mountComponent();
      const $emit = sinon.fake();
      sinon.replace(component.vm, '$emit', $emit);
      trigger.click(component, 'button');
      $emit.calledWith('analyze').should.be.true();
    });

    it('disables the button for an encrypted form without submissions', () => {
      // The button should be disabled even if just the form, not the project,
      // has encryption enabled.
      testData.extendedForms.createPast(1, {
        key: testData.standardKeys.createPast(1, { managed: false }).last(),
        submissions: 0
      });
      const button = mountComponent().first('button');
      button.hasAttribute('disabled').should.be.true();
      button.hasAttribute('title').should.be.true();
    });

    it('disables the button if there is a key', () => {
      testData.extendedProjects.createPast(1, {
        forms: 2,
        lastSubmission: new Date().toISOString()
      });
      testData.extendedForms.createPast(1, { submissions: 1 });
      // The button should be disabled even if the key is not managed.
      testData.standardKeys.createPast(1, { managed: false });
      testData.extendedSubmissions.createPast(1, { status: 'NotDecrypted' });
      const button = mountComponent().first('button');
      button.hasAttribute('disabled').should.be.true();
      button.hasAttribute('title').should.be.true();
    });
  });
});
