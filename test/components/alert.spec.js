import Alert from '../../src/components/alert.vue';

import store from '../../src/store';

import { mount } from '../util/lifecycle';
import { trigger } from '../util/event';

describe('Alert', () => {
  beforeEach(() => {
    store.commit('setAlert', { type: 'info', message: 'Something happened!' });
  });

  it('shows the message', () => {
    const text = mount(Alert).first('.alert-message').text();
    text.should.equal('Something happened!');
  });

  it('adds a contextual class', () => {
    mount(Alert).hasClass('alert-info').should.be.true();
  });

  it('clicking the .close button hides the alert', async () => {
    const alert = mount(Alert);
    await trigger.click(alert, '.close');
    alert.should.be.hidden();
  });
});
