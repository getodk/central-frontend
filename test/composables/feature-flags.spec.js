
import useFeatureFlags from '../../src/composables/feature-flags';

import { mount } from '../util/lifecycle';

const mountComponent = () => {
  const template = '<div :class="features">some text</div>';
  const setup = () => {
    const { features } = useFeatureFlags();
    return { features };
  };
  const component = mount(
    { template, setup },
    { attachTo: document.body }
  );
  return component;
};


describe('useFeatureFlags()', () => {
  it('should return new-web-forms when W + F is pressed', async () => {
    const component = mountComponent();

    component.classes().should.be.empty;

    await component.trigger('keydown', { key: 'w' });
    await component.trigger('keydown', { key: 'f' });

    component.classes()[0].should.be.eql('new-web-forms');

    await component.trigger('keyup', { key: 'w' });
    await component.trigger('keyup', { key: 'f' });

    component.classes().should.be.empty;
  });
});
