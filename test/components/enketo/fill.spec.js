import EnketoFill from '../../../src/components/enketo/fill.vue';

import TestUtilSpan from '../../util/components/span.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockRouter } from '../../util/router';

const mountComponent = (options) =>
  mount(EnketoFill, mergeMountOptions(options, {
    slots: { default: TestUtilSpan },
    container: { router: mockRouter() }
  }));

describe('EnketoFill', () => {
  it('renders correctly for an open form with an enketoId', () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: 'xyz', state: 'open' })
      .last();
    const button = mountComponent({
      props: { formVersion: form },
    });
    button.element.tagName.should.equal('A');
    button.attributes().href.should.equal('/projects/1/forms/f/submissions/new');
    button.get('span').text().should.equal('Some span text');
  });

  it('renders correctly for a form without an enketoId', async () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: null, state: 'open' })
      .last();
    const button = mountComponent({
      props: { formVersion: form },
    });
    button.element.tagName.should.equal('BUTTON');
    button.attributes('aria-disabled').should.equal('true');
    button.should.have.ariaDescription('Web Form is not available yet. It has not finished being processed. Please refresh later and try again.');
    await button.should.have.tooltip();
    button.get('span').text().should.equal('Some span text');
  });

  describe('form is not open', () => {
    it('disables the button for a form with a published version', async () => {
      const form = testData.extendedForms
        .createPast(1, { enketoId: 'xyz', state: 'closing' })
        .last();
      const button = mountComponent({
        props: { formVersion: form },
      });
      button.element.tagName.should.equal('BUTTON');
      button.should.have.ariaDescription('This Form is not accepting new Submissions right now.');
      await button.should.have.tooltip();
    });

    it('does not disable the button for a draft', () => {
      testData.extendedForms.createPast(1, {
        draft: true,
        enketoId: 'xyz',
        state: 'closing'
      });
      const draft = testData.extendedFormDrafts.last();
      const button = mountComponent({
        props: { formVersion: draft },
      });
      button.element.tagName.should.equal('A');
    });
  });

  it('does not disable the button if Web Forms is enabled', () => {
    // The form is not open and also does not have an enketoId. Yet since Web
    // Forms is enabled, it should not be disabled.
    const form = testData.extendedForms
      .createPast(1, { enketoId: null, state: 'closing', webformsEnabled: true })
      .last();
    const button = mountComponent({
      props: { formVersion: form }
    });
    button.element.tagName.should.equal('A');
  });
});
