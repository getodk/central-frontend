import { RouterLinkStub } from '@vue/test-utils';

import Linkable from '../../src/components/linkable.vue';

import { mount } from '../util/lifecycle';

const mountComponent = (options = undefined) => mount(Linkable, {
  ...options,
  slots: { default: '<span id="content"></span>' },
  stubs: { RouterLink: RouterLinkStub },
  mocks: { $route: '/' }
});

describe('Linkable', () => {
  it('renders a <router-link> if the to prop is a relative URL', () => {
    const linkable = mountComponent({
      propsData: { to: '/users' }
    });
    linkable.getComponent(RouterLinkStub).props().to.should.equal('/users');
    linkable.find('#content').exists().should.be.true();
  });

  it('renders a simple <a> element if the to prop is an absolute URL', () => {
    const linkable = mountComponent({
      propsData: { to: 'https://getodk.org' }
    });
    const a = linkable.get('a');
    a.attributes().href.should.equal('https://getodk.org');
    a.find('#content').exists().should.be.true();
  });

  it('renders a button-like <a> element if the clickable prop is true', () => {
    const linkable = mountComponent({
      propsData: { clickable: true }
    });
    const a = linkable.get('a');
    a.attributes().href.should.equal('#');
    a.trigger('click');
    linkable.emitted().click.should.eql([[]]);
    a.find('#content').exists().should.be.true();
  });

  it('renders a <span> otherwise', () => {
    const linkable = mountComponent();
    linkable.element.tagName.should.equal('SPAN');
    linkable.find('a').exists().should.be.false();
    linkable.find('#content').exists().should.be.true();
  });
});
