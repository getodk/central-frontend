import EnketoPreview from '../../../src/components/enketo/preview.vue';
import Form from '../../../src/presenters/form';
import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = (options) => mount(EnketoPreview, {
  ...options,
  propsData: {
    ...options.propsData,
    formVersion: new Form(options.propsData.formVersion)
  }
});

describe('EnketoPreview', () => {
  it('renders correctly for an open form with an enketoId', () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: 'xyz', state: 'open' })
      .last();
    const button = mountComponent({
      propsData: { formVersion: form }
    });
    button.vm.$el.tagName.should.equal('A');
    button.getAttribute('href').should.equal('/_/preview/xyz');
  });

  it('renders correctly for a form without an enketoId', () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: null, state: 'open' })
      .last();
    const button = mountComponent({
      propsData: { formVersion: form }
    });
    button.vm.$el.tagName.should.equal('BUTTON');
    button.should.be.disabled();
    button.getAttribute('title').should.equal('Preview has not finished processing for this Form. Please refresh later and try again.');
  });

  describe('form is not open', () => {
    it('disables the button for a form with a published version', () => {
      const form = testData.extendedForms
        .createPast(1, { enketoId: 'xyz', state: 'closing' })
        .last();
      const button = mountComponent({
        propsData: { formVersion: form }
      });
      button.should.be.disabled();
      button.getAttribute('title').should.equal('In this version of ODK Central, preview is only available for Forms in the Open state.');
    });

    it('does not disable the button for a draft', () => {
      testData.extendedForms.createPast(1, {
        draft: true,
        enketoId: 'xyz',
        state: 'closing'
      });
      const draft = testData.extendedFormDrafts.last();
      const button = mountComponent({
        propsData: { formVersion: draft }
      });
      button.should.not.be.disabled();
    });
  });
});
