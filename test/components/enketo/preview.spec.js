import EnketoPreview from '../../../src/components/enketo/preview.vue';

import testData from '../../data';
import { mount } from '../../util/lifecycle';

describe('EnketoPreview', () => {
  it('renders correctly for an open form with an enketoId', () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: 'xyz', state: 'open' })
      .last();
    const button = mount(EnketoPreview, {
      props: { formVersion: form }
    });
    button.element.tagName.should.equal('A');
    button.attributes().href.should.equal('/-/preview/xyz');
  });

  it('renders correctly for a form without an enketoId', () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: null, state: 'open' })
      .last();
    const button = mount(EnketoPreview, {
      props: { formVersion: form }
    });
    button.element.tagName.should.equal('BUTTON');
    button.element.disabled.should.be.true();
    button.attributes().title.should.equal('Preview has not finished processing for this Form. Please refresh later and try again.');
  });

  describe('form is not open', () => {
    it('disables the button for a form with a published version', () => {
      const form = testData.extendedForms
        .createPast(1, { enketoId: 'xyz', state: 'closing' })
        .last();
      const button = mount(EnketoPreview, {
        props: { formVersion: form }
      });
      button.element.tagName.should.equal('BUTTON');
      button.attributes().title.should.equal('In this version of ODK Central, preview is only available for Forms in the Open state.');
    });

    it('does not disable the button for a draft', () => {
      testData.extendedForms.createPast(1, {
        draft: true,
        enketoId: 'xyz',
        state: 'closing'
      });
      const draft = testData.extendedFormDrafts.last();
      const button = mount(EnketoPreview, {
        props: { formVersion: draft }
      });
      button.element.tagName.should.equal('A');
    });
  });
});
