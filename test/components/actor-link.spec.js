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
      router: true
    });
    const linkIfCan = component.first(LinkIfCan);
    linkIfCan.getProp('to').should.equal('/users/1/edit');
    linkIfCan.text().should.equal('Alice');
    linkIfCan.getAttribute('title').should.equal('Alice');
  });

  it('renders a span if the actor is not a user', () => {
    const actor = testData.extendedFieldKeys
      .createPast(1, { displayName: 'My App User' })
      .last();
    const component = mount(ActorLink, {
      propsData: { actor }
    });
    component.find(LinkIfCan).length.should.equal(0);
    const span = component.first('span');
    span.text().should.equal('My App User');
    span.getAttribute('title').should.equal('My App User');
  });
});
