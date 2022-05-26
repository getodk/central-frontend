import HomeSummaryItem from '../../../../src/components/home/summary/item.vue';
import Linkable from '../../../../src/components/linkable.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';
import { mockRouter } from '../../../util/router';

const mountComponent = (options = undefined) =>
  mount(HomeSummaryItem, mergeMountOptions(options, {
    props: { icon: 'user-circle' },
    slots: {
      title: { template: '<span id="title">Some Title</span>' },
      body: { template: '<span id="body">Some body text</span>' }
    },
    container: { router: mockRouter('/') }
  }));

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

  it('passes the to prop to the Linkable', () => {
    const component = mountComponent({
      props: { to: '/users' }
    });
    component.getComponent(Linkable).props().to.should.equal('/users');
  });

  it('renders a count if one is specified', () => {
    const component = mountComponent({
      props: { count: 1234 }
    });
    component.get('.count').text().should.equal('1,234');
  });
});
