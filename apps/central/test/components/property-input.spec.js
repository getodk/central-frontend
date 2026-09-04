import PropertyInput from '../../src/components/property-input.vue';

import { mergeMountOptions, mount } from '../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(PropertyInput, mergeMountOptions(options, {
    props: { modelValue: '', properties: [] }
  }));

describe('PropertyInput', () => {
  it('uses the modelValue prop', () => {
    const component = mountComponent({
      props: { modelValue: 'foo' }
    });
    component.get('input').element.value.should.equal('foo');
  });

  it('emits an update:modelValue event', async () => {
    const component = mountComponent();
    await component.get('input').setValue('bar');
    component.emitted('update:modelValue').should.eql([['bar']]);
  });

  describe('validation', () => {
    const assertError = (component, title, description = undefined) => {
      const p = component.get('.property-input-error').findAll('p');
      p.length.should.equal(2);

      p[0].text().should.stringMatch(title);

      p[1].text().should.endWith('Try a different name.');
      if (description != null) p[1].text().should.stringMatch(description);

      const input = component.get('input').element;
      input.validationMessage.should.equal(p[0].text());
      input.checkValidity().should.be.false;
    };

    describe('invalid names', () => {
      it('shows an error', () => {
        const component = mountComponent({
          props: { modelValue: '123' }
        });
        assertError(component, 'Property name is invalid');
      });

      it('shows an error for displayName', () => {
        const component = mountComponent({
          props: { type: 'actor', modelValue: 'displayName' }
        });
        assertError(component, 'Property name is invalid');
      });
    });

    describe('duplicate names', () => {
      it('shows an error for a duplicate name', () => {
        const component = mountComponent({
          props: { modelValue: 'foo', properties: ['foo'] }
        });
        assertError(
          component,
          'A property with this name already exists',
          /^Property names must be unique/
        );
      });

      it('shows an error for a case-insensitive duplicate', () => {
        const component = mountComponent({
          props: { modelValue: 'foo', properties: ['FOO'] }
        });
        assertError(component, 'A property with this name already exists');
      });
    });
  });
});
