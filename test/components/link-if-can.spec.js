import LinkIfCan from '../../src/components/link-if-can.vue';
import TestUtilIcon from '../util/components/icon.vue';
import TestUtilSpan from '../util/components/span.vue';
import { mockLogin } from '../util/session';
import { mount } from '../util/lifecycle';

describe('LinkIfCan', () => {
  it('renders a link if the user can navigate to the location', () => {
    mockLogin({ role: 'admin' });
    const component = mount(LinkIfCan, {
      propsData: { to: '/users' },
      slots: { default: TestUtilSpan },
      router: true
    });
    component.vm.$el.tagName.should.equal('A');
    component.getAttribute('href').should.equal('#/users');
    component.first('span').text().should.equal('Some span text');
  });

  it('renders a span if the user cannot navigate to the location', () => {
    mockLogin({ role: 'none' });
    const component = mount(LinkIfCan, {
      propsData: { to: '/users' },
      slots: { default: TestUtilSpan },
      router: true
    });
    component.vm.$el.tagName.should.equal('SPAN');
    component.first('span').text().should.equal('Some span text');
  });

  it('hides an .icon-angle-right if user cannot navigate to location', () => {
    mockLogin({ role: 'none' });
    const component = mount(LinkIfCan, {
      propsData: { to: '/users' },
      slots: {
        default: mount(TestUtilIcon, {
          propsData: { icon: 'angle-right' }
        })
      },
      router: true,
      attachToDocument: true
    });
    component.first('.icon-angle-right').should.be.hidden(true);
  });
});
