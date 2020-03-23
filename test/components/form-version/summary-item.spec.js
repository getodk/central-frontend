import Form from '../../../src/presenters/form';
import FormVersionStandardButtons from '../../../src/components/form-version/standard-buttons.vue';
import FormVersionSummaryItem from '../../../src/components/form-version/summary-item.vue';
import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(FormVersionSummaryItem, {
  propsData: { version: new Form(testData.extendedForms.last()) }
});

describe('FormVersionSummaryItem', () => {
  describe('version string', () => {
    it('shows the version string', () => {
      testData.extendedForms.createPast(1);
      const span = mountComponent().first('.form-version-summary-item-version');
      span.text().trim().should.equal('v1');
      span.getAttribute('title').should.equal('v1');
    });

    it('accounts for an empty version string', () => {
      testData.extendedForms.createPast(1, { version: '' });
      const span = mountComponent().first('.form-version-summary-item-version');
      span.text().trim().should.equal('(blank)');
      span.getAttribute('title').should.equal('(blank)');
      span.hasClass('form-version-summary-item-blank-version').should.be.true();
    });
  });

  it('shows standard form definition buttons', () => {
    testData.extendedForms.createPast(1);
    mountComponent().find(FormVersionStandardButtons).length.should.equal(1);
  });
});
