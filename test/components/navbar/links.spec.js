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
      // Stubbing AnalyticsIntroduction because of its custom <router-link>
      stubs: { RouterLink: RouterLinkStub, AnalyticsIntroduction: true },
      mocks: { $route: '/login' }
    });
    navbar.findComponent(NavbarLinks).exists().should.be.false();
  });

  it('renders the correct links for a sitewide administrator', () => {
    mockLogin();
    const component = mountComponent({
      mocks: { $route: '/' }
    });
    const links = component.findAllComponents(RouterLinkStub);
    const to = links.wrappers.map(link => link.props().to);
    to.should.eql(['/', '/users', '/system/backups']);
  });

  it('renders the correct links for a user without a sitewide role', () => {
    mockLogin({ role: 'none' });
    const component = mountComponent({
      mocks: { $route: '/' }
    });
    const links = component.findAllComponents(RouterLinkStub);
    links.wrappers.map(link => link.props().to).should.eql(['/']);
  });

  describe('active link', () => {
    beforeEach(mockLogin);

    // Array of test cases
    const cases = [
      ['/', '/'],
      ['/projects/1', '/'],
      ['/users', '/users'],
      ['/users/1/edit', '/users'],
      ['/system/audits', '/system/backups']
    ];
    for (const [location, activeLink] of cases) {
      it(`marks ${activeLink} as active for ${location}`, () => {
        const component = mountComponent({
          mocks: { $route: location }
        });
        const active = component.findAll('.active');
        active.length.should.equal(1);
        const link = component.findAllComponents(RouterLinkStub)
          .filter(wrapper => active.at(0).element.contains(wrapper.element))
          .at(0);
        link.props().to.should.equal(activeLink);
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
