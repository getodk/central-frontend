import Form from '../../../src/presenters/form';
import FormVersionSummaryItem from '../../../src/components/form-version/summary-item.vue';
import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(FormVersionSummaryItem, {
  propsData: { version: new Form(testData.extendedForms.last()) }
});

describe('FormVersionSummaryItem', () => {
  it('shows the version string', () => {
    testData.extendedForms.createPast(1, { version: 'v1' });
    const span = mountComponent().first('.form-version-summary-item-version');
    span.text().trim().should.equal('v1');
    span.getAttribute('title').should.equal('v1');
  });

  it('accounts for a blank version', () => {
    testData.extendedForms.createPast(1, { version: '' });
    const span = mountComponent().first('.form-version-summary-item-version');
    span.text().trim().should.equal('(blank)');
    span.getAttribute('title').should.equal('(blank)');
    span.hasClass('form-version-summary-item-blank-version').should.be.true();
  });
});
