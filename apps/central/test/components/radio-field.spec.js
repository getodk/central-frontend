import RadioField from '../../src/components/radio-field.vue';

import { mount } from '../util/lifecycle';

describe('RadioField', () => {
  it('uses the options prop', () => {
    const component = mount(RadioField, {
      props: {
        options: [
          { value: 'jan', text: 'January' },
          { value: 'feb', text: 'February' }
        ],
        modelValue: 'jan'
      }
    });

    const values = component.findAll('input').map(input => input.attributes().value);
    values.should.eql(['jan', 'feb']);

    const text = component.findAll('label').map(label => label.text());
    text.should.eql(['January', 'February']);
  });

  it('uses the modelValue prop', async () => {
    const component = mount(RadioField, {
      props: {
        // Using numeric values, not string, in order to confirm that values are
        // not converted to string in all circumstances.
        options: [{ value: 1, text: 'one' }, { value: 2, text: 'two' }],
        modelValue: 2
      }
    });
    component.get('input:checked').attributes().value.should.equal('2');
    await component.get('input').setChecked();
    component.emitted('update:modelValue').should.eql([[1]]);
    await component.setProps({ modelValue: 1 });
    component.get('input:checked').attributes().value.should.equal('1');
  });

  it('uses the disabled prop', () => {
    const component = mount(RadioField, {
      props: {
        options: [{ value: 1, text: 'one' }, { value: 2, text: 'two' }],
        modelValue: 1,
        disabled: true,
        disabledMessage: 'It is disabled.'
      }
    });

    for (const radio of component.findAll('.radio')) {
      radio.classes('disabled').should.be.true;
      const input = radio.get('input');
      input.element.disabled.should.be.true;
      input.should.have.ariaDescription('It is disabled.');
    }

    component.should.have.tooltip('It is disabled.');
  });
});
