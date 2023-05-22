import { ref } from 'vue';

import TextareaAutosize from '../../src/components/textarea-autosize.vue';

import { mergeMountOptions, mount } from '../util/lifecycle';

const mountComponent = (options = undefined) => {
  // Wrap the component in a .form-group so that its computed styles are
  // correct. Taking this approach rather than mounting a parent component so
  // that we can do things like call setProps() on the component.
  const formGroup = document.createElement('div');
  formGroup.classList.add('form-group');
  document.body.append(formGroup);

  const component = mount(TextareaAutosize, mergeMountOptions(options, {
    props: { modelValue: '' },
    attachTo: formGroup
  }));

  const { unmount } = component;
  component.unmount = () => {
    component.unmount = unmount;
    component.unmount();
    formGroup.remove();
  };

  return component;
};

describe('TextareaAutosize', () => {
  describe('modelValue prop', () => {
    it('sets the value of the textarea to the modelValue prop', () => {
      const component = mountComponent({
        props: { modelValue: 'foo' }
      });
      component.element.value.should.equal('foo');
    });

    it('emits an update:modelValue event after input', async () => {
      const component = mountComponent();
      await component.get('textarea').setValue('foo');
      component.emitted('update:modelValue').should.eql([['foo']]);
    });

    it('changes value of textarea after modelValue prop changes', async () => {
      const component = mountComponent();
      await component.setProps({ modelValue: 'foo' });
      component.element.value.should.equal('foo');
    });
  });

  describe('height', () => {
    it('passes attributes to the textarea', () => {
      const component = mountComponent({
        attrs: { required: true }
      });
      component.element.required.should.be.true();
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
      component.element.style.minHeight.should.equal('123px');
    });

    it('changes the min-height after the prop changes', async () => {
      const component = mountComponent({
        props: { minHeight: 123 }
      });
      await component.setProps({ minHeight: 456 });
      component.element.style.minHeight.should.equal('456px');
    });
  });

  describe('mousedown and mouseup without manual user resize', () => {
    it('sets the min-height CSS property to 0 on mousedown', async () => {
      const component = mountComponent({
        props: { minHeight: 123 }
      });
      await component.trigger('mousedown');
      component.element.style.minHeight.should.equal('0px');
    });

    it('keeps the height above the minHeight prop', async () => {
      const component = mountComponent({
        props: { minHeight: 1000 }
      });
      await component.trigger('mousedown');
      component.element.style.height.should.equal('1000px');
    });

    it('restores the min-height property on mouseup', async () => {
      const component = mountComponent({
        props: { minHeight: 123 }
      });
      await component.trigger('mousedown');
      await component.trigger('mouseup');
      component.element.style.minHeight.should.equal('123px');
    });

    it('restores the height CSS property on mouseup', async () => {
      const component = mountComponent({
        props: { minHeight: 1000 }
      });
      await component.trigger('mousedown');
      await component.trigger('mouseup');
      const height = Number.parseFloat(component.element.style.height);
      height.should.be.within(25, 50);
    });
  });

  describe('user manually resizes textarea', () => {
    const userResize = async () => {
      const component = mountComponent({
        props: { minHeight: 123, mockUserResized: true }
      });
      await component.trigger('mousedown');
      await component.trigger('mouseup');
      return component;
    };

    describe('height', () => {
      it('ignores changes to the modelValue prop', async () => {
        const component = await userResize();
        await component.setProps({ modelValue: 'a'.repeat(5000) });
        await component.vm.$nextTick();
        component.element.style.height.should.equal('123px');
      });

      it('resets the height after resize() is called', async () => {
        const component = await userResize();
        await component.setProps({ modelValue: 'a'.repeat(5000) });
        await component.vm.$nextTick();
        const initialHeight = component.element.getBoundingClientRect().height;
        component.vm.resize();
        const newHeight = component.element.getBoundingClientRect().height;
        newHeight.should.be.above(initialHeight);
        component.element.style.height.should.equal(`${newHeight}px`);
      });

      it('stops ignoring changes after resize() is called', async () => {
        const component = await userResize();
        component.vm.resize();
        const initialHeight = component.element.getBoundingClientRect().height;
        await component.setProps({ modelValue: 'a'.repeat(5000) });
        await component.vm.$nextTick();
        const newHeight = component.element.getBoundingClientRect().height;
        newHeight.should.be.above(initialHeight);
      });
    });

    describe('minHeight prop', () => {
      it('does not restore the min-height CSS property', async () => {
        const component = await userResize();
        component.element.style.minHeight.should.equal('0px');
      });

      it('ignores changes to the minHeight prop', async () => {
        const component = await userResize();
        await component.setProps({ minHeight: 456 });
        component.element.style.minHeight.should.equal('0px');
      });

      it('resets min-height after resize() is called', async () => {
        const component = await userResize();
        component.vm.resize();
        component.element.style.minHeight.should.equal('123px');
      });

      it('stops ignoring changes after resize() is called', async () => {
        const component = await userResize();
        component.vm.resize();
        await component.setProps({ minHeight: 456 });
        component.element.style.minHeight.should.equal('456px');
      });
    });

    describe('user-resized class', () => {
      it('adds the class', async () => {
        const component = await userResize();
        component.classes('user-resized').should.be.true();
      });

      it('removes the class after resize() is called', async () => {
        const component = await userResize();
        component.vm.resize();
        await component.vm.$nextTick();
        component.classes('user-resized').should.be.false();
      });
    });
  });

  it('focuses the textarea after focus() is called', () => {
    const component = mountComponent();
    component.vm.focus();
    component.should.be.focused();
  });
});
