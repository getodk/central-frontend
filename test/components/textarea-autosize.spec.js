import { ref } from 'vue';

import TextareaAutosize from '../../src/components/textarea-autosize.vue';

import { mergeMountOptions, mount } from '../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(TextareaAutosize, mergeMountOptions(options, {
    props: { modelValue: '' },
    attachTo: document.body
  }));

describe('TextareaAutosize', () => {
  describe('modelValue prop', () => {
    it('sets the value of the textarea to the modelValue prop', () => {
      const component = mountComponent({
        props: { modelValue: 'foo' }
      });
      component.get('textarea').element.value.should.equal('foo');
    });

    it('emits an update:modelValue event after input', async () => {
      const component = mountComponent();
      await component.get('textarea').setValue('foo');
      component.emitted('update:modelValue').should.eql([['foo']]);
    });

    it('changes value of textarea after modelValue prop changes', async () => {
      const component = mountComponent();
      await component.setProps({ modelValue: 'foo' });
      component.get('textarea').element.value.should.equal('foo');
    });
  });

  describe('height', () => {
    it('passes attributes to the textarea', () => {
      const component = mountComponent({
        attrs: { required: true }
      });
      component.get('textarea').element.required.should.be.true();
    });

    it('sets the initial height to fit the modelValue prop', () => {
      const Parent = {
        template: `<div>
          <textarea-autosize model-value=""/>
          <textarea-autosize :model-value="'a'.repeat(5000)"/>
        </div>`,
        components: { TextareaAutosize }
      };
      const parent = mount(Parent, { attachTo: document.body });
      const heights = parent.findAll('textarea').map(({ element }) =>
        element.getBoundingClientRect().height);
      heights[1].should.be.above(heights[0]);
    });

    it('adjusts the height after the modelValue prop changes', async () => {
      const component = mountComponent();
      const initialHeight = component.element.getBoundingClientRect().height;
      await component.setProps({ modelValue: 'a'.repeat(5000) });
      await component.vm.$nextTick();
      const newHeight = component.element.getBoundingClientRect().height;
      newHeight.should.be.above(initialHeight);
    });

    it('adjusts the height after the resize() function is called', async () => {
      const Parent = {
        template: `<textarea-autosize v-show="visible" ref="el"
          :model-value="'a'.repeat(5000)"/>`,
        components: { TextareaAutosize },
        props: {
          visible: Boolean
        },
        setup() {
          const el = ref(null);
          return { el, resize: () => el.value.resize() };
        }
      };
      const parent = mount(Parent, { attachTo: document.body });
      const { element } = parent.get('textarea');
      const { style } = element;
      style.height.should.equal('');
      element.getBoundingClientRect().height.should.equal(0);

      await parent.setProps({ visible: true });
      style.height.should.equal('');
      const defaultHeight = element.getBoundingClientRect().height;
      defaultHeight.should.be.above(0);

      parent.vm.resize();
      style.height.should.not.equal('');
      element.getBoundingClientRect().height.should.be.above(defaultHeight);
    });
  });

  describe('minHeight prop', () => {
    it('sets the min-height of the textarea to the minHeight prop', () => {
      const component = mountComponent({
        props: { minHeight: 123 }
      });
      component.get('textarea').element.style.minHeight.should.equal('137px');
    });

    it('changes the min-height after the prop changes', async () => {
      const component = mountComponent({
        props: { minHeight: 123 }
      });
      await component.setProps({ minHeight: 456 });
      component.get('textarea').element.style.minHeight.should.equal('470px');
    });
  });
});
