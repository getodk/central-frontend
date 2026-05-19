import { RouterLinkStub } from '@vue/test-utils';
import Breadcrumbs from '../../../src/components/breadcrumbs.vue';
import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options) => mount(Breadcrumbs, mergeMountOptions(options, {
  global: {
    stubs: { RouterLink: RouterLinkStub }
  }
}));

describe('Breadcrumbs', () => {
  it('renders a trail of breadcrumbs from an array', () => {
    const component = mountComponent({
      props: {
        links: [
          { text: 'Projects', path: '/' },
          { text: 'Forms', path: '/projects/1' }
        ]
      }
    });
    const breadcrumbs = component.get('.breadcrumbs');
    breadcrumbs.text().should.equal('Projects/ Forms');
  });

  it('renders a link', () => {
    const component = mountComponent({
      props: {
        links: [
          { text: 'Forms', path: '/projects/1' }
        ]
      }
    });
    const link = component.find('.breadcrumb-item').getComponent(RouterLinkStub);
    link.props().to.should.equal('/projects/1');
    link.text().should.equal('Forms');
  });

  it('renders text without link if no path provided', () => {
    const component = mountComponent({
      props: {
        links: [
          { text: 'Forms', path: '/projects/1' },
          { text: 'Submission 1' }
        ]
      }
    });
    const crumbs = component.findAll('.breadcrumb-item');
    crumbs[0].text().should.equal('Forms');
    crumbs[0].getComponent(RouterLinkStub).props().to.should.equal('/projects/1');

    crumbs[1].text().should.equal('Submission 1');
    crumbs[1].findComponent(RouterLinkStub).exists().should.be.false;
  });

  it('renders an icon if provided', () => {
    const component = mountComponent({
      props: {
        links: [
          { text: 'Forms', path: '/projects/1', icon: 'icon-database' }
        ]
      }
    });
    component.find('.icon-database').exists().should.be.true;
  });
});
