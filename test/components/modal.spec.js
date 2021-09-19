import Modal from '../../src/components/modal.vue';

import { mount } from '../util/lifecycle';

const mountComponent = (options = {}) => mount(Modal, {
  ...options,
  propsData: {
    state: true,
    hideable: true,
    backdrop: true,
    ...options.propsData
  },
  slots: {
    title: 'Some Title',
    body: '<p>Some text</p>',
    ...options.slots
  }
});

describe('Modal', () => {
  it('adds the modal-lg class if the large prop is true', () => {
    const modal = mountComponent({
      propsData: { large: true }
    });
    modal.get('.modal-dialog').classes('modal-lg').should.be.true();
  });
});
