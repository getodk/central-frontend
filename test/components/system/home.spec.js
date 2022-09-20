import { RouterLinkStub } from '@vue/test-utils';

import PageHead from '../../../src/components/page/head.vue';
import SystemHome from '../../../src/components/system/home.vue';

import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { mockRouter } from '../../util/router';

describe('SystemHome', () => {
  beforeEach(mockLogin);

  it('renders the tabs', () => {
    const component = mount(SystemHome, {
      container: { router: mockRouter('/system/audits') }
    });
    const links = component.getComponent(PageHead).findAllComponents(RouterLinkStub);
    const to = links.map(link => link.props().to);
    to.should.eql(['/system/audits', '/system/analytics', '/system/backups']);
  });

  it('hides the Backups tab if the showsBackups config is false', () => {
    const component = mount(SystemHome, {
      container: {
        router: mockRouter('/system/audits'),
        config: { showsBackups: false }
      }
    });
    component.get('#page-head-tabs li:last-child').should.be.hidden();
  });

  it('hides "Usage Reporting" tab if showsAnalytics config is false', () => {
    const component = mount(SystemHome, {
      container: {
        router: mockRouter('/system/audits'),
        config: { showsAnalytics: false }
      }
    });
    component.get('#page-head-tabs li:nth-child(2)').should.be.hidden();
  });

  describe('active tab', () => {
    it('activates correct tab after user navigates to .../backups', () => {
      const component = mount(SystemHome, {
        container: { router: mockRouter('/system/backups') }
      });
      const links = component.getComponent(PageHead).findAllComponents(RouterLinkStub)
        .filter(link => (link.element.closest('.active') != null));
      links.length.should.equal(1);
      links[0].props().to.should.equal('/system/backups');
    });

    it('activates correct tab after user navigates to .../audits', () => {
      const component = mount(SystemHome, {
        container: { router: mockRouter('/system/audits') }
      });
      const links = component.getComponent(PageHead).findAllComponents(RouterLinkStub)
        .filter(link => (link.element.closest('.active') != null));
      links.length.should.equal(1);
      links[0].props().to.should.equal('/system/audits');
    });

    it('activates correct tab after user navigates to .../analytics', () => {
      const component = mount(SystemHome, {
        container: { router: mockRouter('/system/analytics') }
      });
      const links = component.getComponent(PageHead).findAllComponents(RouterLinkStub)
        .filter(link => (link.element.closest('.active') != null));
      links.length.should.equal(1);
      links[0].props().to.should.equal('/system/analytics');
    });
  });
});
