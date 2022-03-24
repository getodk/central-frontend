import { RouterLinkStub } from '@vue/test-utils';

import HomeSummaryItem from '../../../../src/components/home/summary/item.vue';
import Linkable from '../../../../src/components/linkable.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = (options = {}) => mount(HomeSummaryItem, {
  propsData: {
    icon: 'user-circle',
    ...options.propsData
  },
  slots: {
    title: '<span id="title">Some Title</span>',
    body: '<span id="body">Some body text</span>'
  },
  stubs: { RouterLink: RouterLinkStub },
  mocks: { $route: '/' }
});

describe('HomeSummaryItem', () => {
  it('renders the correct icon', () => {
    mountComponent().find('.icon-user-circle').exists().should.be.true();
  });

  it('uses the title slot', () => {
    mountComponent().find('#title').exists().should.be.true();
  });

  it('uses the body slot', () => {
    mountComponent().find('#body').exists().should.be.true();
  });

  describe('to prop is specified', () => {
    it('passes the prop to the Linkable', () => {
      const component = mountComponent({
        propsData: { to: '/users' }
      });
      component.getComponent(Linkable).props().to.should.equal('/users');
    });

    it('renders an .icon-angle-right', () => {
      const component = mountComponent({
        propsData: { to: '/users' }
      });
      component.find('.icon-angle-right').exists().should.be.true();
    });
  });

  it('renders a count if one is specified', () => {
    const component = mountComponent({
      propsData: { count: 1234 }
    });
    component.get('.count').text().should.equal('1,234');
  });
});
