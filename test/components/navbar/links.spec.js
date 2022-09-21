import { RouterLinkStub } from '@vue/test-utils';

import Navbar from '../../../src/components/navbar.vue';
import NavbarLinks from '../../../src/components/navbar/links.vue';

import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

describe('NavbarLinks', () => {
  it('does not render the links before login', () => {
    const navbar = mount(Navbar, {
      container: { router: mockRouter('/login') },
      global: {
        // Stubbing AnalyticsIntroduction because of its custom <router-link>
        stubs: { AnalyticsIntroduction: true }
      }
    });
    navbar.findComponent(NavbarLinks).exists().should.be.false();
  });

  it('renders the correct links for a sitewide administrator', () => {
    mockLogin();
    const component = mount(NavbarLinks, {
      container: { router: mockRouter('/') }
    });
    const links = component.findAllComponents(RouterLinkStub);
    const to = links.map(link => link.props().to);
    to.should.eql(['/', '/users', '/system/audits']);
  });

  it('renders the correct links for a user without a sitewide role', () => {
    mockLogin({ role: 'none' });
    const component = mount(NavbarLinks, {
      container: { router: mockRouter('/') }
    });
    const links = component.findAllComponents(RouterLinkStub);
    links.map(link => link.props().to).should.eql(['/']);
  });

  describe('active link', () => {
    beforeEach(mockLogin);

    // Array of test cases
    const cases = [
      ['/', '/'],
      ['/projects/1', '/'],
      ['/users', '/users'],
      ['/users/1/edit', '/users'],
      ['/system/analytics', '/system/audits']
    ];
    for (const [location, activeLink] of cases) {
      it(`marks ${activeLink} as active for ${location}`, () => {
        const component = mount(NavbarLinks, {
          container: { router: mockRouter(location) }
        });
        const active = component.findAll('.active');
        active.length.should.equal(1);
        const link = component.findAllComponents(RouterLinkStub).find(wrapper =>
          active[0].element.contains(wrapper.element));
        link.props().to.should.equal(activeLink);
      });
    }

    it('marks no link as active for /account/edit', () => {
      const component = mount(NavbarLinks, {
        container: { router: mockRouter('/account/edit') }
      });
      component.find('.active').exists().should.be.false();
    });
  });
});
