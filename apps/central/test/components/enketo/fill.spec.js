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
  it('renders a link', () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: 'xyz', state: 'open' })
      .last();
    const button = mountComponent({
      props: { formVersion: form },
    });
    button.element.tagName.should.equal('A');
    button.attributes().href.should.equal('/projects/1/forms/f/submissions/new');
  });

  describe('form without an enketoId', () => {
    it('disables the button if webformsEnabled is false', async () => {
      const form = testData.extendedForms
        .createPast(1, { enketoId: null, webformsEnabled: false, state: 'open' })
        .last();
      const button = mountComponent({
        props: { formVersion: form },
      });
      button.element.tagName.should.equal('BUTTON');
      button.attributes('aria-disabled').should.equal('true');
      button.should.have.ariaDescription('Web Form is not available yet. It has not finished being processed. Please refresh later and try again.');
      await button.should.have.tooltip();
    });

    it('does not disable the button if webformsEnabled is true', () => {
      const form = testData.extendedForms
        .createPast(1, { enketoId: null, webformsEnabled: true, state: 'open' })
        .last();
      const button = mountComponent({
        props: { formVersion: form }
      });
      button.element.tagName.should.equal('A');
    });
  });

  describe('form is not open', () => {
    [false, true].forEach(webformsEnabled => {
      describe(`webformsEnabled is ${webformsEnabled}`, () => {
        it('disables the button for a form with a published version', async () => {
          const form = testData.extendedForms
            .createPast(1, { state: 'closing', webformsEnabled, enketoId: 'xyz' })
            .last();
          const button = mountComponent({
            props: { formVersion: form },
          });
          button.element.tagName.should.equal('BUTTON');
          button.attributes('aria-disabled').should.equal('true');
          button.should.have.ariaDescription('This Form is not accepting new Submissions right now.');
          await button.should.have.tooltip();
        });

        it('does not disable the button for a draft', () => {
          testData.extendedForms.createPast(1, {
            draft: true,
            state: 'closing',
            webformsEnabled,
            enketoId: 'xyz'
          });
          const draft = testData.extendedFormDrafts.last();
          const button = mountComponent({
            props: { formVersion: draft },
          });
          button.element.tagName.should.equal('A');
        });
      });
    });
  });

  describe('default slot', () => {
    it('uses the slot when the button is enabled', () => {
      const form = testData.extendedForms
        .createPast(1, { state: 'open', enketoId: 'xyz' })
        .last();
      const button = mountComponent({
        props: { formVersion: form }
      });
      button.element.tagName.should.equal('A');
      button.get('span').text().should.equal('Some span text');
    });

    it('uses the slot when the button is disabled', () => {
      const form = testData.extendedForms
        .createPast(1, { state: 'closing' })
        .last();
      const button = mountComponent({
        props: { formVersion: form }
      });
      button.element.tagName.should.equal('BUTTON');
      button.get('span').text().should.equal('Some span text');
    });
  });
});
