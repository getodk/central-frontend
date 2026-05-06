import sinon from 'sinon';
import { markRaw } from 'vue';

import Alert from '../../src/components/alert.vue';
import Spinner from '../../src/components/spinner.vue';

import createTestContainer from '../util/container';
import { block } from '../util/util';
import { mount } from '../util/lifecycle';

const showDefault = (toast) => { toast.show('Something happened!'); };
const mountComponent = (show = showDefault) => {
  const container = createTestContainer();
  const { toast } = container;
  show(toast);
  return mount(Alert, {
    props: { alert: markRaw(toast) },
    container
  });
};

describe('Alert', () => {
  it('shows the message', () => {
    const text = mountComponent().get('.alert-message').text();
    text.should.equal('Something happened!');
  });

  it('clicking the .close button hides the alert', async () => {
    const component = mountComponent();
    await component.get('.close').trigger('click');
    component.vm.$container.toast.state.should.be.false;
  });

  describe('CTA', () => {
    it('shows the CTA button', async () => {
      const fake = sinon.fake();
      const component = mountComponent(toast => {
        toast.show('Something happened!').cta('Click here', fake);
      });
      const button = component.get('.alert-cta');
      button.text().should.equal('Click here');
      await button.trigger('click');
      fake.called.should.be.true;
    });

    it('updates the button during an async CTA', async () => {
      const [lock, unlock] = block();
      const component = mountComponent(toast => {
        toast.show('Something happened!').cta('Click here', () => lock);
      });
      const button = component.get('.alert-cta');
      await button.trigger('click');
      button.attributes('aria-disabled').should.equal('true');
      component.getComponent(Spinner).props().state.should.be.true;
      unlock();
    });
  });
});
