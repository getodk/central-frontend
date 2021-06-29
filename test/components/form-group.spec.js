import FormGroup from '../../src/components/form-group.vue';

import TestUtilSpan from '../util/components/span.vue';

import { mount } from '../util/lifecycle';

const mountComponent = (mountOptions = {}) => mount(FormGroup, {
  ...mountOptions,
  propsData: {
    value: '',
    placeholder: 'My input',
    autocomplete: 'off',
    ...mountOptions.propsData
  }
});

describe('FormGroup', () => {
  it('uses the value prop', () => {
    const formGroup = mountComponent({
      propsData: { value: 'x' }
    });
    formGroup.get('input').element.value.should.equal('x');
  });

  it('emits an input event', async () => {
    const formGroup = mountComponent({
      propsData: { value: 'x' }
    });
    await formGroup.get('input').setValue('y');
    formGroup.emitted().input.should.eql([['y']]);
  });

  it('emits a change event', async () => {
    const formGroup = mountComponent({
      propsData: { value: 'x' }
    });
    const input = formGroup.get('input');
    input.element.value = 'y';
    await input.trigger('change');
    formGroup.emitted().change.should.eql([['y']]);
  });

  describe('required prop', () => {
    it('renders correctly if the prop is true', () => {
      const formGroup = mountComponent({
        propsData: { placeholder: 'My input', required: true }
      });
      const { required, placeholder } = formGroup.get('input').attributes();
      should.exist(required);
      placeholder.should.equal('My input *');
    });

    it('renders correctly if the prop is false', () => {
      const formGroup = mountComponent({
        propsData: { placeholder: 'My input', required: false }
      });
      const { required, placeholder } = formGroup.get('input').attributes();
      should.not.exist(required);
      placeholder.should.equal('My input');
    });
  });

  it('has the correct class if hasError is true', () => {
    const formGroup = mountComponent({
      propsData: { hasError: true }
    });
    formGroup.classes('has-error').should.be.true();
  });

  it('passes the autocomplete prop to the input', () => {
    const formGroup = mountComponent({
      propsData: { autocomplete: 'name' }
    });
    formGroup.get('input').attributes().autocomplete.should.equal('name');
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
