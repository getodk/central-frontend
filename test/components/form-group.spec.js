import FormGroup from '../../src/components/form-group.vue';

import TestUtilSpan from '../util/components/span.vue';

import { loadAsync } from '../../src/util/load-async';

import { mergeMountOptions, mount } from '../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(FormGroup, mergeMountOptions(options, {
    props: { modelValue: '', placeholder: 'My input', autocomplete: 'off' }
  }));

describe('FormGroup', () => {
  it('uses the modelValue prop', () => {
    const formGroup = mountComponent({
      props: { modelValue: 'x' }
    });
    formGroup.get('input').element.value.should.equal('x');
  });

  it('emits an update:modelValue event', async () => {
    const formGroup = mountComponent({
      props: { modelValue: 'x' }
    });
    await formGroup.get('input').setValue('y');
    formGroup.emitted('update:modelValue').should.eql([['y']]);
  });

  describe('required prop', () => {
    it('renders correctly if the prop is true', () => {
      const formGroup = mountComponent({
        props: { placeholder: 'My input', required: true }
      });
      const { required, placeholder } = formGroup.get('input').attributes();
      should.exist(required);
      placeholder.should.equal('My input *');
    });

    it('renders correctly if the prop is false', () => {
      const formGroup = mountComponent({
        props: { placeholder: 'My input', required: false }
      });
      const { required, placeholder } = formGroup.get('input').attributes();
      should.not.exist(required);
      placeholder.should.equal('My input');
    });
  });

  it('has the correct class if hasError is true', () => {
    const formGroup = mountComponent({
      props: { hasError: true }
    });
    formGroup.classes('has-error').should.be.true();
  });

  it('passes the autocomplete prop to the input', () => {
    const formGroup = mountComponent({
      props: { autocomplete: 'name' }
    });
    formGroup.get('input').attributes().autocomplete.should.equal('name');
  });

  it.skip("shows password strength meter if autocomplete prop equals 'new-password'", async () => {
    const formGroup = mountComponent({
      props: { modelValue: 'foo', autocomplete: 'new-password' }
    });
    const Password = await loadAsync('Password')();
    await formGroup.vm.$nextTick();
    formGroup.getComponent(Password).props().value.should.equal('foo');
  });

  it('passes attributes to the input', () => {
    const formGroup = mountComponent({
      attrs: { type: 'email' }
    });
    formGroup.get('input').attributes().type.should.equal('email');
  });

  it('uses the before slot', () => {
    const formGroup = mountComponent({
      slots: { before: TestUtilSpan }
    });
    const { children } = formGroup.element;
    const tags = Array.from(children).map(child => child.tagName);
    tags.should.eql(['SPAN', 'INPUT', 'SPAN']);
  });

  it('uses the after slot', () => {
    const formGroup = mountComponent({
      slots: { after: TestUtilSpan }
    });
    const { children } = formGroup.element;
    const tags = Array.from(children).map(child => child.tagName);
    tags.should.eql(['INPUT', 'SPAN', 'SPAN']);
    children[2].textContent.should.equal('Some span text');
  });

  specify('focus() focuses the input', () => {
    const formGroup = mountComponent({ attachTo: document.body });
    formGroup.vm.focus();
    formGroup.get('input').should.be.focused();
  });
});
