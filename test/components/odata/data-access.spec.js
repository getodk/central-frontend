import OdataDataAccess from '../../../src/components/odata/data-access.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(OdataDataAccess, mergeMountOptions(options, {
    props: { analyzeDisabled: false }
  }));

describe('OdataDataAccess', () => {
  it('does not render anything if SSO is enabled', () => {
    const component = mountComponent({
      container: {
        config: { oidcEnabled: true }
      }
    });
    component.find('*').exists().should.be.false();
  });

  describe('"Analyze via OData" button', () => {
    it('emits an analyze event', async () => {
      testData.extendedForms.createPast(1);
      const component = mountComponent();
      await component.get('button').trigger('click');
      component.emitted().analyze.should.eql([[]]);
    });

    it('disables the button and sets message according to props', async () => {
      testData.extendedForms.createPast(1);
      const button = mountComponent({
        props: {
          analyzeDisabled: true,
          analyzeDisabledMessage: 'This has been disabled.'
        }
      }).get('button');
      button.attributes('aria-disabled').should.equal('true');
      button.should.have.ariaDescription();
      await button.should.have.tooltip('This has been disabled.');
    });

    it('disables the button for an encrypted form without submissions', async () => {
      // The button should be disabled even if just the form, not the project,
      // has encryption enabled.
      testData.extendedForms.createPast(1, {
        key: testData.standardKeys.createPast(1, { managed: false }).last(),
        submissions: 0
      });

      const component = await load('/projects/1/forms/f/submissions', {
        root: false
      });

      const button = component.findComponent(OdataDataAccess).get('button');
      button.attributes('aria-disabled').should.equal('true');
      button.should.have.ariaDescription();
      await button.should.have.tooltip();
    });

    it('disables the button if there is a key', async () => {
      testData.extendedProjects.createPast(1, {
        forms: 2,
        lastSubmission: new Date().toISOString()
      });
      testData.extendedForms.createPast(1, { submissions: 1 });
      // The button should be disabled even if the key is not managed.
      testData.standardKeys.createPast(1, { managed: false });
      testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });

      const component = await load('/projects/1/forms/f/submissions', {
        root: false
      });

      const button = component.findComponent(OdataDataAccess).get('button');
      button.attributes('aria-disabled').should.equal('true');
      button.should.have.ariaDescription();
      await button.should.have.tooltip();
    });
  });
});
