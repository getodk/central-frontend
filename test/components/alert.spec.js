import Alert from '../../src/components/alert.vue';

import createTestContainer from '../util/container';
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
    mountComponent().classes('alert-info').should.be.true();
  });

  it('clicking the .close button hides the alert', async () => {
    const component = mountComponent();
    await component.get('.close').trigger('click');
    component.should.be.hidden();
  });
});
