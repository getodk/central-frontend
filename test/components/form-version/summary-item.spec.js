import Form from '../../../src/presenters/form';
import FormVersionSummaryItem from '../../../src/components/form-version/summary-item.vue';

import TestUtilP from '../../util/components/p.vue';

import testData from '../../data';
import { mount } from '../../util/lifecycle';

describe('FormVersionSummaryItem', () => {
  describe('version string', () => {
    it('shows the version string', () => {
      const form = testData.extendedForms.createPast(1).last();
      const component = mount(FormVersionSummaryItem, {
        propsData: { version: new Form(form) }
      });
      const span = component.get('.version span');
      span.text().should.equal('v1');
      span.attributes().title.should.equal('v1');
    });

    it('accounts for an empty version string', () => {
      const form = testData.extendedForms.createPast(1, { version: '' }).last();
      const component = mount(FormVersionSummaryItem, {
        propsData: { version: new Form(form) }
      });
      const version = component.get('.version');
      version.classes('blank-version').should.be.true();
      const span = version.get('span');
      span.text().should.equal('(blank)');
      span.attributes().title.should.equal('(blank)');
    });
  });

  it('uses the body slot', () => {
    const form = testData.extendedForms.createPast(1).last();
    const component = mount(FormVersionSummaryItem, {
      propsData: { version: new Form(form) },
      slots: { body: TestUtilP }
    });
    component.get('.summary-item-body p').text().should.equal('Some p text');
  });
});
