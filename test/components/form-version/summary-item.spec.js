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
      const span = component.first('.version span');
      span.text().trim().should.equal('v1');
      span.getAttribute('title').should.equal('v1');
    });

    it('accounts for an empty version string', () => {
      const form = testData.extendedForms.createPast(1, { version: '' }).last();
      const component = mount(FormVersionSummaryItem, {
        propsData: { version: new Form(form) }
      });
      const version = component.first('.version');
      version.hasClass('blank-version').should.be.true();
      const span = version.first('span');
      span.text().trim().should.equal('(blank)');
      span.getAttribute('title').should.equal('(blank)');
    });
  });

  it('uses the body slot', () => {
    const form = testData.extendedForms.createPast(1).last();
    const component = mount(FormVersionSummaryItem, {
      propsData: { version: new Form(form) },
      slots: { body: TestUtilP }
    });
    component.first('.summary-item-body p').text().should.equal('Some p text');
  });
});
