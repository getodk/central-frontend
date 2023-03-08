import { RouterLinkStub } from '@vue/test-utils';

import PageBack from '../../../src/components/page/back.vue';

import TestUtilSpan from '../../util/components/span.vue';

import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options) => mount(PageBack, mergeMountOptions(options, {
  global: {
    stubs: { RouterLink: RouterLinkStub }
  }
}));

describe('PageBack', () => {
  describe('location specified for the title', () => {
    it('renders a link', () => {
      const component = mountComponent({
        props: { to: ['/users', '/account/edit'] }
      });
      const link = component.get('#page-back-title').getComponent(RouterLinkStub);
      link.props().to.should.equal('/users');
    });

    it('uses the title slot', () => {
      const component = mountComponent({
        props: { to: ['/users', '/account/edit'] },
        slots: { title: TestUtilSpan }
      });
      const text = component.get('#page-back-title a span').text();
      text.should.equal('Some span text');
    });
  });

  describe('location is not specified for the title', () => {
    it('does not render a link if the to prop is string', () => {
      const component = mountComponent({
        props: { to: '/account/edit' }
      });
      component.find('#page-back-title a').exists().should.be.false();
    });

    it('does not render a link if first element of to prop is null', () => {
      const component = mountComponent({
        props: { to: [null, '/account/edit'] }
      });
      component.find('#page-back-title a').exists().should.be.false();
    });

    it('still uses the title slot', () => {
      const component = mountComponent({
        props: { to: '/account/edit' },
        slots: { title: TestUtilSpan }
      });
      const text = component.get('#page-back-title span').text();
      text.should.equal('Some span text');
    });
  });

  describe('link for the back slot', () => {
    it('renders a link if the to prop is string', () => {
      const component = mountComponent({
        props: { to: '/account/edit' }
      });
      const links = component.findAllComponents(RouterLinkStub);
      links.length.should.equal(1);
      links[0].attributes().id.should.equal('page-back-back');
      links[0].props().to.should.equal('/account/edit');
    });

    it('renders a link if the to prop is an array', () => {
      const component = mountComponent({
        props: { to: ['/users', '/account/edit'] }
      });
      const links = component.findAllComponents(RouterLinkStub);
      links.length.should.equal(2);
      links[1].attributes().id.should.equal('page-back-back');
      links[1].props().to.should.equal('/account/edit');
    });
  });

  it('uses the back slot', () => {
    const component = mountComponent({
      props: { to: '/users' },
      slots: { back: TestUtilSpan }
    });
    component.get('#page-back-back span').text().should.equal('Some span text');
  });
});
