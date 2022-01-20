import FormVersionSummaryItem from '../../../src/components/form-version/summary-item.vue';

import TestUtilP from '../../util/components/p.vue';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options = undefined) => {
  const merged = mergeMountOptions(options, {
    props: { version: testData.extendedForms.last() }
  });
  merged.container = createTestContainer(merged.container);
  const { Form } = merged.container;
  merged.props.version = new Form(merged.props.version);
  return mount(FormVersionSummaryItem, merged);
};

describe('FormVersionSummaryItem', () => {
  describe('version string', () => {
    it('shows the version string', () => {
      testData.extendedForms.createPast(1);
      const component = mountComponent();
      const span = component.get('.version span');
      span.text().should.equal('v1');
      span.attributes().title.should.equal('v1');
    });

    it('accounts for an empty version string', () => {
      testData.extendedForms.createPast(1, { version: '' });
      const component = mountComponent();
      const version = component.get('.version');
      version.classes('blank-version').should.be.true();
      const span = version.get('span');
      span.text().should.equal('(blank)');
      span.attributes().title.should.equal('(blank)');
    });
  });

  it('uses the body slot', () => {
    testData.extendedForms.createPast(1);
    const component = mount(FormVersionSummaryItem, {
      slots: { body: TestUtilP }
    });
    component.get('.summary-item-body p').text().should.equal('Some p text');
  });
});
