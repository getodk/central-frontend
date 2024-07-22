import EnketoPreview from '../../../src/components/enketo/preview.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockRouter } from '../../util/router';

const mountComponent = (options) =>
  mount(EnketoPreview, mergeMountOptions(options, {
    container: { router: mockRouter('/projects/1/forms/f') }
  }));

describe('EnketoPreview', () => {
  it('renders correctly for an open form with an enketoId', () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: 'xyz', state: 'open' })
      .last();
    const component = mountComponent({
      props: { formVersion: form }
    });
    const button = component.get('.enketo-preview');
    button.element.tagName.should.equal('A');
    button.attributes().href.should.equal('/-/preview/xyz');
  });

  it('renders correctly for a form without an enketoId', async () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: null, state: 'open' })
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

  describe('form is not open', () => {
    it('disables the button for a form with a published version', async () => {
      const form = testData.extendedForms
        .createPast(1, { enketoId: 'xyz', state: 'closing' })
        .last();
      const component = mountComponent({
        props: { formVersion: form }
      });
      const button = component.get('.enketo-preview');
      button.element.tagName.should.equal('BUTTON');
      button.should.have.ariaDescription('In this version of ODK Central, preview is only available for Forms in the Open state.');
      await button.should.have.tooltip();
    });

    it('does not disable the button for a draft', () => {
      testData.extendedForms.createPast(1, {
        draft: true,
        enketoId: 'xyz',
        state: 'closing'
      });
      const draft = testData.extendedFormDrafts.last();
      const component = mountComponent({
        props: { formVersion: draft }
      });
      component.get('.enketo-preview').element.tagName.should.equal('A');
    });
  });
});
