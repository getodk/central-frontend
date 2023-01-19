import EnketoFill from '../../../src/components/enketo/fill.vue';

import TestUtilSpan from '../../util/components/span.vue';

import testData from '../../data';
import { mount } from '../../util/lifecycle';

describe('EnketoFill', () => {
  it('renders correctly for an open form with an enketoId', () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: 'xyz', state: 'open' })
      .last();
    const button = mount(EnketoFill, {
      props: { formVersion: form },
      slots: { default: TestUtilSpan }
    });
    button.element.tagName.should.equal('A');
    button.attributes().href.should.equal('/-/xyz');
    button.get('span').text().should.equal('Some span text');
  });

  it('renders correctly for a form without an enketoId', async () => {
    const form = testData.extendedForms
      .createPast(1, { enketoId: null, state: 'open' })
      .last();
    const button = mount(EnketoFill, {
      props: { formVersion: form },
      slots: { default: TestUtilSpan }
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
      const button = mount(EnketoFill, {
        props: { formVersion: form },
        slots: { default: TestUtilSpan }
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
      const button = mount(EnketoFill, {
        props: { formVersion: draft },
        slots: { default: TestUtilSpan }
      });
      button.element.tagName.should.equal('A');
    });
  });
});
