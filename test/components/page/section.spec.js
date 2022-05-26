import PageSection from '../../../src/components/page/section.vue';

import { mount } from '../../util/lifecycle';

const mountComponent = (options) => mount(PageSection, {
  ...options,
  slots: {
    heading: { template: '<span>Some Title</span>' },
    body: { template: '<p>Some body text</p>' }
  }
});

describe('PageSection', () => {
  it('adds a class if the horizontal prop is true', () => {
    const component = mountComponent({
      props: { horizontal: true }
    });
    component.classes('horizontal').should.be.true();
  });
});
