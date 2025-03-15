import { RouterLinkStub } from '@vue/test-utils';

import InfoNav from '../../src/components/infonav.vue';

import { mergeMountOptions, mount } from '../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(InfoNav, mergeMountOptions(options, {
    props: { link: '/some-link' },
    slots: {
      title: 'Test Title'
    },
    global: {
      stubs: { RouterLink: RouterLinkStub }
    }
  }));

describe('InfoNav', () => {
  it('renders the link correctly when the link prop is provided', () => {
    const link = mountComponent().getComponent(RouterLinkStub);
    link.text().should.equal('Test Title');
    link.props().to.should.equal('/some-link');
  });

  it('does not include dropdown when link is provided', () => {
    const component = mountComponent();
    component.find('.dropdown-menu').exists().should.be.false;
  });

  it('renders the dropdown menu when the slot is provided', () => {
    const component = mountComponent({
      props: { link: null },
      slots: {
        title: 'Test Title',
        dropdown: '<li>Dropdown Item</li>'
      }
    });
    component.get('button').text().should.equal('Test Title');
    const dropdownMenu = component.get('.dropdown-menu');
    dropdownMenu.text().should.contain('Dropdown Item');
  });
});
