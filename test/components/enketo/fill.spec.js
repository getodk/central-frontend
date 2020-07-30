import EnketoFill from '../../../src/components/enketo/fill.vue';
import Form from '../../../src/presenters/form';
import TestUtilSpan from '../../util/components/span.vue';
import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = (options) => mount(EnketoFill, {
  ...options,
  propsData: {
    ...options.propsData,
    formVersion: new Form(options.propsData.formVersion)
  }
});

describe('EnketoFill', () => {
  it('renders correctly for an open form with an enketoId', () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: 'xyz', state: 'open' })
      .last();
    const button = mountComponent({
      propsData: { formVersion: form },
      slots: { default: TestUtilSpan }
    });
    button.vm.$el.tagName.should.equal('A');
    button.getAttribute('href').should.equal('/_/xyz');
    button.first('span').text().should.equal('Some span text');
  });

  it('renders correctly for a form without an enketoId', () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: null, state: 'open' })
      .last();
    const button = mountComponent({
      propsData: { formVersion: form },
      slots: { default: TestUtilSpan }
    });
    button.vm.$el.tagName.should.equal('BUTTON');
    button.should.be.disabled();
    button.getAttribute('title').should.equal('Web Form is not available yet. It has not finished being processed. Please refresh later and try again.');
    button.first('span').text().should.equal('Some span text');
  });

  describe('form is not open', () => {
    it('disables the button for a form with a published version', () => {
      const form = testData.extendedForms
        .createPast(1, { enketoId: 'xyz', state: 'closing' })
        .last();
      const button = mountComponent({
        propsData: { formVersion: form },
        slots: { default: TestUtilSpan }
      });
      button.should.be.disabled();
      button.getAttribute('title').should.equal('This Form is not accepting new Submissions right now.');
    });

    it('does not disable the button for a draft', () => {
      testData.extendedForms.createPast(1, {
        draft: true,
        enketoId: 'xyz',
        state: 'closing'
      });
      const draft = testData.extendedFormDrafts.last();
      const button = mountComponent({
        propsData: { formVersion: draft },
        slots: { default: TestUtilSpan }
      });
      button.should.not.be.disabled();
    });
  });
});
