import HomeSummaryItem from '../../../../src/components/home/summary/item.vue';
import Linkable from '../../../../src/components/linkable.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';
import { mockRouter } from '../../../util/router';

const mountComponent = (options = undefined) =>
  mount(HomeSummaryItem, mergeMountOptions(options, {
    props: { icon: 'user-circle' },
    slots: {
      header: { template: '<span id="header">Some Header</span>' },
      subheader: { template: '<span id="subheader">Some Subheader</span>' },
      body: { template: '<span id="body">Some body text</span>' }
    },
    container: { router: mockRouter('/') }
  }));

describe('HomeSummaryItem', () => {
  it('renders the correct icon', () => {
    mountComponent().find('.icon-user-circle').exists().should.be.true;
  });

  it('uses the header slot', () => {
    mountComponent().find('#header').exists().should.be.true;
  });

  it('uses the subheader slot', () => {
    mountComponent().find('#subheader').exists().should.be.true;
  });

  it('uses the body slot', () => {
    mountComponent().find('#body').exists().should.be.true;
  });

  it('passes the to prop to the Linkable', () => {
    const component = mountComponent({
      props: { to: '/users' }
    });
    component.getComponent(Linkable).props().to.should.equal('/users');
  });
});
