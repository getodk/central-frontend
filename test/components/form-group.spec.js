import FormGroup from '../../src/components/form-group.vue';
import PasswordStrength from '../../src/components/password-strength.vue';

import TestUtilSpan from '../util/components/span.vue';

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

  it('uses the tooltip prop', async () => {
    const formGroup = mountComponent({
      props: { tooltip: 'Some description' }
    });
    const input = formGroup.get('input');
    input.should.have.ariaDescription('Some description');
    await input.should.have.tooltip('Some description');
  });

  it('has the correct class if hasError is true', () => {
    const formGroup = mountComponent({
      props: { hasError: true }
    });
    formGroup.classes('has-error').should.be.true;
  });

  it('passes the autocomplete prop to the input', () => {
    const formGroup = mountComponent({
      props: { autocomplete: 'name' }
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

  test('focus() focuses the input', () => {
    const formGroup = mountComponent({ attachTo: document.body });
    formGroup.vm.focus();
    formGroup.get('input').should.be.focused();
  });

  describe('number input', () => {
    it('emits a number', async () => {
      const formGroup = mountComponent({
        props: { modelValue: 1 },
        attrs: { type: 'number' }
      });
      await formGroup.get('input').setValue('2');
      formGroup.emitted('update:modelValue').should.eql([[2]]);
    });

    it('emits an empty string if the input is empty', async () => {
      const formGroup = mountComponent({
        props: { modelValue: 1 },
        attrs: { type: 'number' }
      });
      await formGroup.get('input').setValue('');
      formGroup.emitted('update:modelValue').should.eql([['']]);
    });
  });

  describe('password strength meter', () => {
    it('renders a password strength meter if autocomplete is new-password', () => {
      const formGroup = mountComponent({
        props: { modelValue: 'supersecret', autocomplete: 'new-password' }
      });
      const passwordStrength = formGroup.getComponent(PasswordStrength);
      passwordStrength.props().password.should.equal('supersecret');
    });

    it('does not render a password strength meter otherwise', () => {
      const formGroup = mountComponent({
        props: { autocomplete: 'off' }
      });
      formGroup.findComponent(PasswordStrength).exists().should.be.false;
    });

    it('hides the strength meter for a password confirmation input', () => {
      const Form = {
        template: `<form>
          <form-group model-value="" type="password"
            placeholder="New password" autocomplete="new-password"/>
          <form-group model-value="" type="password"
            placeholder="New password (confirm)" autocomplete="new-password"/>
        </form>`,
        components: { FormGroup }
      };
      const form = mount(Form, { attachTo: document.body });
      const passwordStrength = form.findAllComponents(PasswordStrength);
      passwordStrength.length.should.equal(2);
      passwordStrength[0].should.be.visible(true);
      passwordStrength[1].should.be.hidden(true);
    });
  });
});
