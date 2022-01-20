import { RouterLinkStub } from '@vue/test-utils';

import PageBack from '../../../src/components/page/back.vue';

import TestUtilSpan from '../../util/components/span.vue';

import { mount } from '../../util/lifecycle';

describe('PageBack', () => {
  describe('linkTitle prop is true', () => {
    it('renders a link', () => {
      const component = mount(PageBack, {
        props: { to: '/users', linkTitle: true },
        global: {
          stubs: { RouterLink: RouterLinkStub }
        }
      });
      const link = component.getComponent(RouterLinkStub);
      should.exist(link.element.closest('#page-back-title'));
      link.props().to.should.equal('/users');
    });

    it('uses the title slot', () => {
      const component = mount(PageBack, {
        props: { to: '/users', linkTitle: true },
        slots: { title: TestUtilSpan },
        global: {
          stubs: { RouterLink: RouterLinkStub }
        }
      });
      const text = component.getComponent(RouterLinkStub).get('span').text();
      text.should.equal('Some span text');
    });
  });

  describe('linkTitle prop is false', () => {
    it('does not render a link', () => {
      const component = mount(PageBack, {
        props: { to: '/users', linkTitle: false },
        global: {
          stubs: { RouterLink: RouterLinkStub }
        }
      });
      component.find('#page-back-title a').exists().should.be.false();
    });

    it('uses the title slot', () => {
      const component = mount(PageBack, {
        props: { to: '/users', linkTitle: false },
        slots: { title: TestUtilSpan },
        global: {
          stubs: { RouterLink: RouterLinkStub }
        }
      });
      const text = component.get('#page-back-title span').text();
      text.should.equal('Some span text');
    });
  });

  it('renders a link for the back slot', () => {
    const component = mount(PageBack, {
      props: { to: '/users' },
      global: {
        stubs: { RouterLink: RouterLinkStub }
      }
    });
    const link = component.getComponent(RouterLinkStub);
    link.attributes().id.should.equal('page-back-back');
    link.props().to.should.equal('/users');
  });

  it('uses the back slot', () => {
    const component = mount(PageBack, {
      props: { to: '/users' },
      slots: { back: TestUtilSpan },
      global: {
        stubs: { RouterLink: RouterLinkStub }
      }
    });
    component.get('#page-back-back span').text().should.equal('Some span text');
  });
});
