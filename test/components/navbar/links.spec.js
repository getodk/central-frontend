import { RouterLinkStub } from '@vue/test-utils';

import Navbar from '../../../src/components/navbar.vue';
import NavbarLinks from '../../../src/components/navbar/links.vue';

import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = (options) => mount(NavbarLinks, {
  stubs: { RouterLink: RouterLinkStub },
  ...options
});

describe('NavbarLinks', () => {
  it('does not render the links before login', () => {
    const navbar = mount(Navbar, {
      stubs: { RouterLink: RouterLinkStub },
      mocks: { $route: '/login' }
    });
    navbar.findComponent(NavbarLinks).exists().should.be.false();
  });

  describe('sitewide administrator', () => {
    beforeEach(mockLogin);

    it('shows the Projects Link', () => {
      const component = mountComponent({
        mocks: { $route: '/' }
      });
      component.get('#navbar-links-projects').should.be.visible();
    });

    it('shows the Users link', () => {
      const component = mountComponent({
        mocks: { $route: '/' }
      });
      component.get('#navbar-links-users').should.be.visible();
    });

    it('shows the System link', () => {
      const component = mountComponent({
        mocks: { $route: '/' }
      });
      component.get('#navbar-links-system').should.be.visible();
    });
  });

  describe('user with no sitewide role', () => {
    beforeEach(() => {
      mockLogin({ role: 'none' });
    });

    it('shows the Projects link', () => {
      const component = mountComponent({
        mocks: { $route: '/' }
      });
      component.get('#navbar-links-projects').should.be.visible();
    });

    it('does not render the Users link', () => {
      const component = mountComponent({
        mocks: { $route: '/' }
      });
      component.find('#navbar-links-users').exists().should.be.false();
    });

    it('does not render the System link', () => {
      const component = mountComponent({
        mocks: { $route: '/' }
      });
      component.find('#navbar-links-system').exists().should.be.false();
    });
  });

  describe('active link', () => {
    beforeEach(mockLogin);

    // Array of test cases
    const cases = [
      ['/', '#navbar-links-projects'],
      ['/projects/1', '#navbar-links-projects'],
      ['/users', '#navbar-links-users'],
      ['/users/1/edit', '#navbar-links-users'],
      ['/system/audits', '#navbar-links-system']
    ];
    for (const [route, link] of cases) {
      it(`marks ${link} as active for ${route}`, () => {
        const component = mountComponent({
          mocks: { $route: route }
        });
        const active = component.findAll('.active');
        active.length.should.equal(1);
        active.at(0).find(link).exists().should.be.true();
      });
    }

    it('marks no link as active for /account/edit', () => {
      const component = mountComponent({
        mocks: { $route: '/account/edit' }
      });
      component.find('.active').exists().should.be.false();
    });
  });
});
