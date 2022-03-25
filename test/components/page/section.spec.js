import PageSection from '../../../src/components/page/section.vue';

import { mount } from '../../util/lifecycle';

const mountComponent = (options) => mount(PageSection, {
  ...options,
  slots: { heading: '<span>Some Title</span>', body: '<p>Some body text</p>' }
});

describe('PageSection', () => {
  it('adds a class if the horizontal prop is true', () => {
    const component = mountComponent({
      propsData: { horizontal: true }
    });
    component.classes('horizontal').should.be.true();
  });
});
