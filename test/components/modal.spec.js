import sinon from 'sinon';

import Alert from '../../src/components/alert.vue';
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
  it('shows any alert', () => {
    mountComponent().findComponent(Alert).exists().should.be.true();
  });

  describe('state prop is true', () => {
    it('shows the modal', () => {
      mountComponent({
        propsData: { state: true },
        attachTo: document.body
      });
      document.body.classList.contains('modal-open').should.be.true();
    });

    it('emits a shown event', () => {
      const modal = mountComponent({
        propsData: { state: true }
      });
      modal.emitted().shown.should.eql([[]]);
    });
  });

  describe('after the state prop changes to true', () => {
    it('shows the modal', async () => {
      const modal = mountComponent({
        propsData: { state: false },
        attachTo: document.body
      });
      await modal.setProps({ state: true });
      document.body.classList.contains('modal-open').should.be.true();
    });

    it('hides any alert', async () => {
      const modal = mountComponent({
        propsData: { state: false }
      });
      modal.vm.$alert().info('Some alert');
      await modal.setProps({ state: true });
      modal.should.not.alert();
    });
  });

  describe('after the state prop changes to false', () => {
    it('hides the modal', async () => {
      const modal = mountComponent({
        propsData: { state: true },
        attachTo: document.body
      });
      await modal.setProps({ state: false });
      document.body.classList.contains('modal-open').should.be.false();
    });

    it('hides an alert that was shown before modal was hidden', async () => {
      const modal = mountComponent({
        propsData: { state: true }
      });
      modal.vm.$alert().info('Some alert');
      await modal.vm.$nextTick();
      await modal.setProps({ state: false });
      modal.should.not.alert();
    });

    it('does not hide an alert that is set as modal is hidden', async () => {
      const modal = mountComponent({
        propsData: { state: true }
      });
      modal.vm.$alert().info('Some alert');
      await modal.setProps({ state: false });
      modal.should.alert();
    });
  });

  it('adds the modal-lg class if the large prop is true', () => {
    const modal = mountComponent({
      propsData: { large: true }
    });
    modal.get('.modal-dialog').classes('modal-lg').should.be.true();
  });
});
