import sinon from 'sinon';
import { nextTick } from 'vue';

import Alert from '../../src/components/alert.vue';
import Spinner from '../../src/components/spinner.vue';

import createTestContainer from '../util/container';
import { block } from '../util/util';
import { mount } from '../util/lifecycle';

const mountComponent = () => {
  const container = createTestContainer();
  const { alert } = container;
  alert.info('Something happened!');
  return mount(Alert, { container });
};

describe('Alert', () => {
  it('shows the message', () => {
    const text = mountComponent().get('.alert-message').text();
    text.should.equal('Something happened!');
  });

  it('adds a contextual class', () => {
    mountComponent().classes('alert-info').should.be.true;
  });

  it('clicking the .close button hides the alert', async () => {
    const component = mountComponent();
    await component.get('.close').trigger('click');
    component.should.be.hidden();
  });

  describe('CTA', () => {
    it('shows the CTA button', async () => {
      const container = createTestContainer();
      const { alert } = container;
      const fake = sinon.fake();
      alert.info('Something happened!').cta('Click here', fake);
      const button = mount(Alert, { container }).get('.alert-cta');
      button.text().should.equal('Click here');
      await button.trigger('click');
      fake.called.should.be.true;
    });

    it('updates the button during an async CTA', async () => {
      const container = createTestContainer();
      const { alert } = container;
      const [lock, unlock] = block();
      alert.info('Something happened!').cta('Click here', () => lock);
      const component = mount(Alert, { container });
      const button = component.get('.alert-cta');

      await button.trigger('click');
      component.should.be.visible();
      button.attributes('aria-disabled').should.equal('true');
      button.getComponent(Spinner).props().state.should.be.true;

      unlock();
      await nextTick();
      await nextTick();
      component.should.be.hidden();
    });
  });
});
