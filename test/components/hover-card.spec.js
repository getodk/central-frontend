import HoverCard from '../../src/components/hover-card.vue';

import { mount } from '../util/lifecycle';

describe('HoverCard', () => {
  it('uses the icon prop', () => {
    const component = mount(HoverCard, {
      props: { icon: 'file' }
    });
    const icon = component.get('.hover-card-heading span');
    icon.classes('icon-file').should.be.true;
  });
});
