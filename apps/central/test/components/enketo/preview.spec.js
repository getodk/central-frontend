import EnketoPreview from '../../../src/components/enketo/preview.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockRouter } from '../../util/router';

const mountComponent = (options) =>
  mount(EnketoPreview, mergeMountOptions(options, {
    container: { router: mockRouter('/projects/1') }
  }));

describe('EnketoPreview', () => {
  it('renders with canonical link', () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: 'xyz', state: 'open' })
      .last();
    const component = mountComponent({
      props: { formVersion: form }
    });
    const button = component.get('.enketo-preview');
    button.element.tagName.should.equal('A');
    button.attributes().href.should.equal('/projects/1/forms/f/preview');
  });

  describe('form without an enketoId', () => {
    it('disables the button if webformsEnabled is false', async () => {
      const form = testData.extendedForms
        .createPast(1, { enketoId: null, webformsEnabled: false, state: 'open' })
        .last();
      const component = mountComponent({
        props: { formVersion: form }
      });
      const button = component.get('.enketo-preview');
      button.element.tagName.should.equal('BUTTON');
      button.attributes('aria-disabled').should.equal('true');
      button.should.have.ariaDescription('Preview has not finished processing for this Form. Please refresh later and try again.');
      await button.should.have.tooltip();
    });

    it('does not disable the button if webformsEnabled is true', () => {
      // The form does not have an enketoId and also is not open. Yet because
      // Web Forms is enabled, the button should not be disabled.
      const form = testData.extendedForms
        .createPast(1, { enketoId: null, webformsEnabled: true, state: 'closing' })
        .last();
      const component = mountComponent({
        props: { formVersion: form }
      });
      component.get('.enketo-preview').element.tagName.should.equal('A');
    });
  });

  describe('form is not open', () => {
    it('disables the button if webformsEnabled is false', async () => {
      const form = testData.extendedForms
        .createPast(1, { state: 'closing', webformsEnabled: false, enketoId: 'xyz' })
        .last();
      const component = mountComponent({
        props: { formVersion: form }
      });
      const button = component.get('.enketo-preview');
      button.element.tagName.should.equal('BUTTON');
      button.attributes('aria-disabled').should.equal('true');
      button.should.have.ariaDescription('In this version of ODK Central, preview is only available for Forms in the Open state.');
      await button.should.have.tooltip();
    });

    it('does not disable the button if webformsEnabled is true', () => {
      const form = testData.extendedForms
        .createPast(1, { state: 'closing', webformsEnabled: true })
        .last();
      const component = mountComponent({
        props: { formVersion: form }
      });
      component.get('.enketo-preview').element.tagName.should.equal('A');
    });

    it('does not disable the button for a draft', () => {
      testData.extendedForms.createPast(1, {
        draft: true,
        state: 'closing',
        webformsEnabled: false,
        enketoId: 'xyz'
      });
      const draft = testData.extendedFormDrafts.last();
      const component = mountComponent({
        props: { formVersion: draft }
      });
      component.get('.enketo-preview').element.tagName.should.equal('A');
    });
  });
});
