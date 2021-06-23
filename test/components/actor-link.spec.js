import { RouterLinkStub } from '@vue/test-utils';

import ActorLink from '../../src/components/actor-link.vue';
import LinkIfCan from '../../src/components/link-if-can.vue';

import testData from '../data';
import { mockLogin } from '../util/session';
import { mount } from '../util/lifecycle';

describe('ActorLink', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
  });

  it('renders a LinkIfCan component if the actor is a user', () => {
    const component = mount(ActorLink, {
      propsData: { actor: testData.extendedUsers.first() },
      stubs: { RouterLink: RouterLinkStub },
      mocks: { $route: '/system/audits' }
    });
    const linkIfCan = component.getComponent(LinkIfCan);
    linkIfCan.props().to.should.equal('/users/1/edit');
    linkIfCan.text().should.equal('Alice');
    linkIfCan.attributes().title.should.equal('Alice');
  });

  it('renders a span if the actor is not a user', () => {
    const actor = testData.extendedFieldKeys
      .createPast(1, { displayName: 'My App User' })
      .last();
    const component = mount(ActorLink, {
      propsData: { actor },
      stubs: { RouterLink: RouterLinkStub },
      mocks: { $route: '/system/audits' }
    });
    component.findComponent(LinkIfCan).exists().should.be.false();
    component.element.tagName.should.equal('SPAN');
    component.text().should.equal('My App User');
    component.attributes().title.should.equal('My App User');
  });
});
