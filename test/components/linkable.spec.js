import { RouterLinkStub } from '@vue/test-utils';

import Linkable from '../../src/components/linkable.vue';

import { mount } from '../util/lifecycle';

const mountComponent = (options = undefined) => mount(Linkable, {
  ...options,
  slots: {
    default: { template: '<span id="content"></span>' }
  },
  global: {
    stubs: { RouterLink: RouterLinkStub }
  }
});

describe('Linkable', () => {
  it('renders a <router-link> if the to prop is a relative URL', () => {
    const linkable = mountComponent({
      props: { to: '/users' }
    });
    linkable.getComponent(RouterLinkStub).props().to.should.equal('/users');
    linkable.find('#content').exists().should.be.true();
  });

  it('renders a simple <a> element if the to prop is an absolute URL', () => {
    const linkable = mountComponent({
      props: { to: 'https://getodk.org' }
    });
    const a = linkable.get('a');
    a.attributes().href.should.equal('https://getodk.org');
    a.attributes().target.should.equal('_blank');
    a.find('#content').exists().should.be.true();
  });

  it('renders a button-like <a> element if the clickable prop is true', () => {
    const linkable = mountComponent({
      props: { clickable: true }
    });
    const a = linkable.get('a');
    a.attributes().href.should.equal('#');
    a.trigger('click');
    linkable.emitted().click.should.eql([[]]);
    a.find('#content').exists().should.be.true();
  });

  describe('to prop does not exist and clickable prop is false', () => {
    it('renders a <span> by default', () => {
      const linkable = mountComponent();
      linkable.element.tagName.should.equal('SPAN');
      linkable.find('a').exists().should.be.false();
      linkable.find('#content').exists().should.be.true();
    });

    it('uses the tag prop', () => {
      const linkable = mountComponent({
        props: { tag: 'div' }
      });
      linkable.element.tagName.should.equal('DIV');
    });
  });
});
