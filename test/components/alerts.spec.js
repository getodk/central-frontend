import { nextTick } from 'vue';
import { pick } from 'ramda';

import Alerts from '../../src/components/alerts.vue';
import Modal from '../../src/components/modal.vue';
import RedAlert from '../../src/components/red-alert.vue';
import Toast from '../../src/components/toast.vue';

import { modalData } from '../../src/util/reactivity';

import { mount } from '../util/lifecycle';
import { wait } from '../util/util';

const Parent = {
  template: `
    <div>
      <Alerts/>
      <Modal v-bind="modal">
        <template #title>Some Modal</template>
        <template #body>Some text</template>
      </Modal>
    </div>
  `,
  components: { Alerts, Modal },
  setup() {
    return { modal: modalData() };
  }
};
const mountComponent = () => {
  const parent = mount(Parent, { attachTo: document.body });
  const component = parent.getComponent(Alerts);
  return {
    components: {
      Toast: component.getComponent(Toast),
      RedAlert: component.getComponent(RedAlert),
      Modal: parent.getComponent(Modal)
    },
    ...pick(['toast', 'redAlert'], parent.vm.$container),
    modal: parent.vm.modal
  };
};

describe('Alerts', () => {
  it('shows the latest alert', async () => {
    const { components, toast, redAlert } = mountComponent();
    components.Toast.should.be.hidden(true);
    components.RedAlert.should.be.hidden(true);

    toast.show('foo');
    await nextTick();
    components.Toast.should.be.visible(true);
    components.RedAlert.should.be.hidden(true);

    await wait(1); // Ensure that redAlert.at > toast.at.
    redAlert.show('bar');
    await nextTick();
    components.Toast.should.be.hidden(true);
    components.RedAlert.should.be.visible(true);

    toast.show('baz');
    await nextTick();
    components.Toast.should.be.visible(true);
    components.RedAlert.should.be.hidden(true);
  });

  describe('showing a modal', () => {
    it('hides a toast', async () => {
      const { components, toast, modal } = mountComponent();
      toast.show('foo');
      await nextTick();
      components.Toast.should.be.visible(true);
      modal.show();
      await nextTick();
      toast.state.should.be.false;
      components.Toast.should.be.hidden(true);
    });

    it('hides a red alert', async () => {
      const { components, redAlert, modal } = mountComponent();
      redAlert.show('foo');
      await nextTick();
      components.RedAlert.should.be.visible(true);
      modal.show();
      await nextTick();
      redAlert.state.should.be.false;
      components.RedAlert.should.be.hidden(true);
      components.Modal.getComponent(RedAlert).should.be.hidden(true);
    });
  });

  describe('modal is open', () => {
    it('shows a red alert inside the modal', async () => {
      const { components, redAlert, modal } = mountComponent();
      modal.show();
      await nextTick();
      redAlert.show('foo');
      await nextTick();
      components.Modal.getComponent(RedAlert).should.be.visible(true);
      components.RedAlert.should.be.hidden(true);
    });

    it('does not hide a toast after showing a red alert', async () => {
      const { components, toast, redAlert, modal } = mountComponent();
      modal.show();
      await nextTick();
      toast.show('foo');
      await nextTick();
      redAlert.show('bar');
      await nextTick();
      components.Toast.should.be.visible(true);
      components.Modal.getComponent(RedAlert).should.be.visible(true);
      components.RedAlert.should.be.hidden(true);
    });

    it('does not hide a red alert after showing a toast', async () => {
      const { components, toast, redAlert, modal } = mountComponent();
      modal.show();
      await nextTick();
      redAlert.show('foo');
      await nextTick();
      toast.show('bar');
      await nextTick();
      components.Modal.getComponent(RedAlert).should.be.visible(true);
      components.Toast.should.be.visible(true);
      components.RedAlert.should.be.hidden(true);
    });
  });

  describe('hiding a modal', () => {
    it('hides a red alert', async () => {
      const { components, redAlert, modal } = mountComponent();
      modal.show();
      await nextTick();
      redAlert.show('foo');
      await nextTick();
      modal.hide();
      await nextTick();
      redAlert.state.should.be.false;
      components.RedAlert.should.be.hidden(true);
    });

    it('does not hide a toast', async () => {
      const { components, toast, modal } = mountComponent();
      modal.show();
      await nextTick();
      toast.show('foo');
      await nextTick();
      modal.hide();
      await nextTick();
      components.Toast.should.be.visible(true);
    });

    it('does not hide a toast even if there was a more recent red alert', async () => {
      const { components, toast, redAlert, modal } = mountComponent();
      modal.show();
      await nextTick();
      toast.show('foo');
      await nextTick();
      redAlert.show('bar');
      await nextTick();
      modal.hide();
      await nextTick();
      components.Toast.should.be.visible(true);
    });
  });
});
