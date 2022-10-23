import SubmissionDataAccess from '../../../src/components/submission/data-access.vue';

import testData from '../../data';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => mount(SubmissionDataAccess, {
  props: { formVersion: testData.extendedForms.last() },
  container: {
    requestData: testRequestData(['keys'], {
      keys: testData.standardKeys.sorted()
    })
  }
});

describe('SubmissionDataAccess', () => {
  describe('"Analyze via OData" button', () => {
    it('emits an analyze event', async () => {
      testData.extendedForms.createPast(1);
      const component = mountComponent();
      await component.get('button').trigger('click');
      component.emitted().analyze.should.eql([[]]);
    });

    it('disables the button for an encrypted form without submissions', () => {
      // The button should be disabled even if just the form, not the project,
      // has encryption enabled.
      testData.extendedForms.createPast(1, {
        key: testData.standardKeys.createPast(1, { managed: false }).last(),
        submissions: 0
      });
      const button = mountComponent().get('button');
      button.element.disabled.should.be.true();
      should.exist(button.attributes().title);
    });

    it('disables the button if there is a key', () => {
      testData.extendedProjects.createPast(1, {
        forms: 2,
        lastSubmission: new Date().toISOString()
      });
      testData.extendedForms.createPast(1, { submissions: 1 });
      // The button should be disabled even if the key is not managed.
      testData.standardKeys.createPast(1, { managed: false });
      testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
      const button = mountComponent().get('button');
      button.element.disabled.should.be.true();
      should.exist(button.attributes().title);
    });
  });
});
