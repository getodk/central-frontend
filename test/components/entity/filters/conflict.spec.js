import EntityFiltersConflict from '../../../../src/components/entity/filters/conflict.vue';
import Multiselect from '../../../../src/components/multiselect.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = (options) => mount(EntityFiltersConflict, options);
const toggle = (multiselect) => multiselect.get('select').trigger('click');

describe('EntityFiltersConflict', () => {
  it('passes the modelValue prop to the Multiselect', () => {
    const component = mountComponent({
      props: { modelValue: [true] }
    });
    expect(component.getComponent(Multiselect).props().modelValue).to.eql([true]);
  });

  it('passes a new value for modelValue prop to Multiselect', async () => {
    const component = mountComponent({
      props: { modelValue: [true] }
    });
    await component.setProps({ modelValue: [false] });
    expect(component.getComponent(Multiselect).props().modelValue).to.eql([false]);
  });

  it('emits an update:modelValue event if selection is changed', async () => {
    const component = mountComponent({
      props: { modelValue: [true, false] },
      attachTo: document.body
    });
    const multiselect = component.getComponent(Multiselect);
    await toggle(multiselect);
    await multiselect.get('input[type="checkbox"]').setValue(false);
    await toggle(multiselect);
    component.emitted('update:modelValue').should.eql([[[false]]]);
  });

  describe('no options are selected', () => {
    it('falls back to all options', async () => {
      const component = mountComponent({
        props: { modelValue: [true] },
        attachTo: document.body
      });
      const multiselect = component.getComponent(Multiselect);
      await toggle(multiselect);
      await multiselect.get('.select-none').trigger('click');
      await toggle(multiselect);
      component.emitted('update:modelValue').should.eql([[[true, false]]]);
    });

    it('does not emit an event if all options were already selected', async () => {
      const component = mountComponent({
        props: { modelValue: [true, false] },
        attachTo: document.body
      });
      const multiselect = component.getComponent(Multiselect);
      await toggle(multiselect);
      await multiselect.get('.select-none').trigger('click');
      await toggle(multiselect);
      should.not.exist(component.emitted('update:modelValue'));
    });
  });
});
