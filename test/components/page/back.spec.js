import PageBack from '../../../src/components/page/back.vue';

import TestUtilSpan from '../../util/components/span.vue';

import { mount } from '../../util/lifecycle';

describe('PageBack', () => {
  describe('linkTitle prop is true', () => {
    it('renders a link', () => {
      const component = mount(PageBack, {
        propsData: { to: '/users', linkTitle: true },
        router: true
      });
      const href = component.first('#page-back-title a').getAttribute('href');
      href.should.equal('#/users');
    });

    it('uses the title slot', () => {
      const component = mount(PageBack, {
        propsData: { to: '/users', linkTitle: true },
        slots: { title: TestUtilSpan },
        router: true
      });
      const text = component.first('#page-back-title a span').text();
      text.should.equal('Some span text');
    });
  });

  describe('linkTitle prop is false', () => {
    it('does not render a link', () => {
      const component = mount(PageBack, {
        propsData: { to: '/users', linkTitle: false },
        router: true
      });
      component.find('#page-back-title a').length.should.equal(0);
    });

    it('uses the title slot', () => {
      const component = mount(PageBack, {
        propsData: { to: '/users', linkTitle: false },
        slots: { title: TestUtilSpan },
        router: true
      });
      const text = component.first('#page-back-title span').text();
      text.should.equal('Some span text');
    });
  });

  it('renders a link for the back slot', () => {
    const component = mount(PageBack, {
      propsData: { to: '/users' },
      router: true
    });
    const href = component.first('#page-back-back').getAttribute('href');
    href.should.equal('#/users');
  });

  it('uses the back slot', () => {
    const component = mount(PageBack, {
      propsData: { to: '/users' },
      slots: { back: TestUtilSpan },
      router: true
    });
    const text = component.first('#page-back-back span').text();
    text.should.equal('Some span text');
  });
});
