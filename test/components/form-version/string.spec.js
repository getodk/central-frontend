import FormVersionString from '../../../src/components/form-version/string.vue';

import { mount } from '../../util/lifecycle';

describe('FormVersionString', () => {
  it('shows the version string', () => {
    const component = mount(FormVersionString, {
      props: { version: 'v1' }
    });
    component.text().should.equal('v1');
    component.attributes().title.should.equal('v1');
  });

  it('accounts for an empty version string', () => {
    const component = mount(FormVersionString, {
      props: { version: '' }
    });
    component.text().should.equal('(blank)');
    component.attributes().title.should.equal('(blank)');
    component.classes('blank-version').should.be.true();
  });
});
