import { RouterLinkStub } from '@vue/test-utils';

import PageHead from '../../../src/components/page/head.vue';
import SystemHome from '../../../src/components/system/home.vue';

import store from '../../../src/store';

import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

describe('SystemHome', () => {
  beforeEach(mockLogin);

  it('renders the tabs', () => {
    const component = mount(SystemHome, {
      stubs: { RouterLink: RouterLinkStub, RouterView: true },
      mocks: { $route: '/system/backups' }
    });
    const links = component.getComponent(PageHead).findAllComponents(RouterLinkStub);
    const to = links.wrappers.map(link => link.props().to);
    to.should.eql(['/system/backups', '/system/audits', '/system/analytics']);
  });

  it('hides the Backups tab if the showsBackups config is false', () => {
    store.commit('setConfig', { key: 'showsBackups', value: false });
    const component = mount(SystemHome, {
      stubs: { RouterLink: RouterLinkStub, RouterView: true },
      mocks: { $route: '/system/audits' }
    });
    component.get('#page-head-tabs li').should.be.hidden();
  });

  it('hides "Usage Reporting" tab if showsAnalytics config is false', () => {
    store.commit('setConfig', { key: 'showsAnalytics', value: false });
    const component = mount(SystemHome, {
      stubs: { RouterLink: RouterLinkStub, RouterView: true },
      mocks: { $route: '/system/backups' }
    });
    component.findAll('#page-head-tabs li').at(2).should.be.hidden();
  });

  describe('active tab', () => {
    it('activates correct tab after user navigates to .../backups', () => {
      const component = mount(SystemHome, {
        stubs: { RouterLink: RouterLinkStub, RouterView: true },
        mocks: { $route: '/system/backups' }
      });
      const links = component.getComponent(PageHead).findAllComponents(RouterLinkStub)
        .filter(link => (link.element.closest('.active') != null));
      links.length.should.equal(1);
      links.at(0).props().to.should.equal('/system/backups');
    });

    it('activates correct tab after user navigates to .../audits', () => {
      const component = mount(SystemHome, {
        stubs: { RouterLink: RouterLinkStub, RouterView: true },
        mocks: { $route: '/system/audits' }
      });
      const links = component.getComponent(PageHead).findAllComponents(RouterLinkStub)
        .filter(link => (link.element.closest('.active') != null));
      links.length.should.equal(1);
      links.at(0).props().to.should.equal('/system/audits');
    });

    it('activates correct tab after user navigates to .../analytics', () => {
      const component = mount(SystemHome, {
        stubs: { RouterLink: RouterLinkStub, RouterView: true },
        mocks: { $route: '/system/analytics' }
      });
      const links = component.getComponent(PageHead).findAllComponents(RouterLinkStub)
        .filter(link => (link.element.closest('.active') != null));
      links.length.should.equal(1);
      links.at(0).props().to.should.equal('/system/analytics');
    });
  });
});
