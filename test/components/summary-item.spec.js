import { RouterLinkStub } from '@vue/test-utils';

import SummaryItem from '../../src/components/summary-item.vue';

import { mount } from '../util/lifecycle';

const mountComponent = (options = {}) => mount(SummaryItem, {
  props: { icon: 'check', ...options.props },
  slots: {
    heading: '<span>Some heading</span>',
    body: '<span>Some body</span>'
  },
  stubs: { RouterLink: RouterLinkStub }
});

describe('SummaryItem', () => {
  it('renders the correct icon', () => {
    const item = mountComponent({
      props: { icon: 'user-circle' }
    });
    item.find('.icon-user-circle').exists().should.be.true();
  });

  it('renders links if the routeTo prop is specified', () => {
    const item = mountComponent({
      props: { routeTo: '/users' }
    });
    const links = item.findAllComponents(RouterLinkStub);
    links.length.should.equal(3);
    links.wrappers.map(link => link.props().to).should.matchEach('/users');
  });

  it('emits a click event if the clickable prop is true', async () => {
    const item = mountComponent({
      props: { clickable: true }
    });
    const a = item.findAll('a');
    a.length.should.equal(3);
    await a.at(0).trigger('click');
    await a.at(1).trigger('click');
    await a.at(2).trigger('click');
    item.emitted().click.length.should.equal(3);
  });
});
