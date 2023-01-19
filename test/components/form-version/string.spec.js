import FormVersionString from '../../../src/components/form-version/string.vue';

import { mount } from '../../util/lifecycle';

describe('FormVersionString', () => {
  it('shows the version string', async () => {
    const component = mount(FormVersionString, {
      props: { version: 'final_version' }
    });
    component.text().should.equal('final_version');
    await component.should.have.textTooltip();
  });

  it('accounts for an empty version string', () => {
    const component = mount(FormVersionString, {
      props: { version: '' }
    });
    component.text().should.equal('(blank)');
    component.classes('blank-version').should.be.true();
  });
});
