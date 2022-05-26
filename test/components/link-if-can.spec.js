import { RouterLinkStub } from '@vue/test-utils';

import LinkIfCan from '../../src/components/link-if-can.vue';

import TestUtilSpan from '../util/components/span.vue';

import { mockLogin } from '../util/session';
import { mockRouter } from '../util/router';
import { mount } from '../util/lifecycle';

describe('LinkIfCan', () => {
  it('renders a link if the user can navigate to the location', () => {
    mockLogin({ role: 'admin' });
    const component = mount(LinkIfCan, {
      props: { to: '/users' },
      slots: { default: TestUtilSpan },
      container: { router: mockRouter('/') }
    });
    const link = component.getComponent(RouterLinkStub);
    link.props().to.should.equal('/users');
    link.get('span').text().should.equal('Some span text');
  });

  it('renders a span if the user cannot navigate to the location', () => {
    mockLogin({ role: 'none' });
    const component = mount(LinkIfCan, {
      props: { to: '/users' },
      slots: { default: TestUtilSpan },
      container: { router: mockRouter('/') }
    });
    component.findComponent(RouterLinkStub).exists().should.be.false();
    component.element.tagName.should.equal('SPAN');
    component.get('span').text().should.equal('Some span text');
  });

  it('hides an .icon-angle-right if user cannot navigate to location', () => {
    mockLogin({ role: 'none' });
    const component = mount(LinkIfCan, {
      props: { to: '/users' },
      slots: {
        default: { template: '<span class="icon-angle-right"></span>' }
      },
      container: { router: mockRouter('/') },
      attachTo: document.body
    });
    component.get('.icon-angle-right').should.be.hidden(true);
  });
});
