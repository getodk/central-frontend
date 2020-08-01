import sinon from 'sinon';

import FormGroup from '../../src/components/form-group.vue';
import TestUtilSpan from '../util/components/span.vue';
import { mount } from '../util/lifecycle';
import { trigger } from '../util/event';

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
    formGroup.first('input').element.value.should.equal('x');
  });

  it('emits an input event', async () => {
    const formGroup = mountComponent({
      propsData: { value: 'x' }
    });
    const fake = sinon.fake();
    sinon.replace(formGroup.vm, '$emit', fake);
    await trigger.input(formGroup, 'input', 'y');
    fake.calledWith('input', 'y').should.be.true();
  });

  it('emits a change event', async () => {
    const formGroup = mountComponent({
      propsData: { value: 'x' }
    });
    const fake = sinon.fake();
    sinon.replace(formGroup.vm, '$emit', fake);
    await trigger.changeValue(formGroup, 'input', 'y');
    fake.calledWith('change', 'y').should.be.true();
  });

  describe('required prop', () => {
    it('renders correctly if the prop is true', () => {
      const formGroup = mountComponent({
        propsData: { placeholder: 'My input', required: true }
      });
      const input = formGroup.first('input');
      input.hasAttribute('required').should.be.true();
      input.getAttribute('placeholder').should.equal('My input *');
    });

    it('renders correctly if the prop is false', () => {
      const formGroup = mountComponent({
        propsData: { placeholder: 'My input', required: false }
      });
      const input = formGroup.first('input');
      input.hasAttribute('required').should.be.false();
      input.getAttribute('placeholder').should.equal('My input');
    });
  });

  it('has the correct class if hasError is true', () => {
    const formGroup = mountComponent({
      propsData: { hasError: true }
    });
    formGroup.hasClass('has-error').should.be.true();
  });

  it('passes the autocomplete prop to the input', () => {
    const formGroup = mountComponent({
      propsData: { autocomplete: 'name' }
    });
    formGroup.first('input').getAttribute('autocomplete').should.equal('name');
  });

  it('passes attributes to the input', () => {
    const formGroup = mountComponent({
      attrs: { type: 'email' }
    });
    formGroup.first('input').getAttribute('type').should.equal('email');
  });

  it('uses the before slot', () => {
    const formGroup = mountComponent({
      slots: { before: TestUtilSpan }
    });
    const { children } = formGroup.vm.$el;
    const tags = Array.from(children).map(child => child.tagName);
    tags.should.eql(['SPAN', 'INPUT', 'SPAN']);
  });

  it('uses the after slot', () => {
    const formGroup = mountComponent({
      slots: { after: TestUtilSpan }
    });
    const { children } = formGroup.vm.$el;
    const tags = Array.from(children).map(child => child.tagName);
    tags.should.eql(['INPUT', 'SPAN', 'SPAN']);
    children[2].textContent.should.equal('Some span text');
  });

  specify('focus() focuses the input', () => {
    const formGroup = mountComponent({ attachToDocument: true });
    formGroup.vm.focus();
    formGroup.first('input').should.be.focused();
  });
});
