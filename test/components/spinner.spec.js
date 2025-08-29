import Spinner from '../../src/components/spinner.vue';

import { mount } from '../util/lifecycle';

describe('Spinner', () => {
  it('adds the correct class if the state prop is true', () => {
    const spinner = mount(Spinner, {
      props: { state: true }
    });
    spinner.classes('active').should.be.true;
  });

  it('adds the correct class if the inline prop is true', () => {
    const spinner = mount(Spinner, {
      props: { inline: true }
    });
    spinner.classes('inline').should.be.true;
  });
});
