import CustomPropsFilter from '../../src/components/custom-props-filter.vue';

import { mount } from '../util/lifecycle';

const actorProperties = [{ name: 'region' }, { name: 'department' }];

const actors = [
  { id: 1, properties: { region: 'North', department: 'Health' } },
  { id: 2, properties: { region: 'South', department: 'Health' } },
  { id: 3, properties: { region: 'North', department: '' } },
  { id: 4, properties: {} }
];

const mountComponent = (props = {}) =>
  mount(CustomPropsFilter, {
    props: { modelValue: null, actorProperties, actors, ...props }
  });

const openDropdown = (component) =>
  component.get('.dropdown-trigger').trigger('click');

describe('CustomPropsFilter', () => {
  describe('display value', () => {
    it('shows "All" when no filter is active', () => {
      const component = mountComponent();
      component.get('.display-value').text().should.equal('All');
    });

    it('shows "property = value" when a filter is active', () => {
      const component = mountComponent({ modelValue: { property: 'region', value: 'North' } });
      component.get('.display-value').text().should.equal('region = North');
    });
  });

  describe('property select', () => {
    it('lists all actorProperties as options', async () => {
      const component = mountComponent();
      await openDropdown(component);
      const options = component.findAll('.property-select option').slice(1);
      options.map(o => o.text()).should.eql(['region', 'department']);
    });
  });

  describe('value select', () => {
    it('is disabled when no property is selected', async () => {
      const component = mountComponent();
      await openDropdown(component);
      component.get('.value-select').attributes('disabled').should.exist;
    });

    it('shows distinct sorted non-empty values for the selected property', async () => {
      const component = mountComponent();
      await openDropdown(component);
      await component.get('.property-select').setValue('region');
      const options = component.findAll('.value-select option').slice(1);
      options.map(o => o.text()).should.eql(['North', 'South']);
    });

    it('excludes empty-string values', async () => {
      const component = mountComponent();
      await openDropdown(component);
      await component.get('.property-select').setValue('department');
      const options = component.findAll('.value-select option').slice(1);
      options.map(o => o.text()).should.eql(['Health']);
    });

    it('resets to empty when the selected property changes', async () => {
      const component = mountComponent();
      await openDropdown(component);
      await component.get('.property-select').setValue('region');
      await component.get('.value-select').setValue('North');
      await component.get('.property-select').setValue('department');
      component.get('.value-select').element.value.should.equal('');
    });
  });

  describe('Apply button', () => {
    it('is disabled when no property is selected', async () => {
      const component = mountComponent();
      await openDropdown(component);
      component.get('.apply-btn').attributes('aria-disabled').should.equal('true');
    });

    it('is disabled when a property is selected but no value', async () => {
      const component = mountComponent();
      await openDropdown(component);
      await component.get('.property-select').setValue('region');
      component.get('.apply-btn').attributes('aria-disabled').should.equal('true');
    });

    it('not disabled when both property and value are selected', async () => {
      const component = mountComponent();
      await openDropdown(component);
      await component.get('.property-select').setValue('region');
      await component.get('.value-select').setValue('North');
      component.get('.apply-btn').attributes('aria-disabled').should.equal('false');
    });

    it('emits update:modelValue with the selected property and value', async () => {
      const component = mountComponent();
      await openDropdown(component);
      await component.get('.property-select').setValue('region');
      await component.get('.value-select').setValue('North');
      await component.get('.apply-btn').trigger('click');
      component.emitted('update:modelValue').should.eql([[{ property: 'region', value: 'North' }]]);
    });
  });

  describe('Clear/trash button', () => {
    it('is disabled when no filter is active and pending selections are empty', async () => {
      const component = mountComponent();
      await openDropdown(component);
      component.get('.btn-trash').attributes('disabled').should.exist;
    });

    it('is not disabled when a filter is active', async () => {
      const component = mountComponent({ modelValue: { property: 'region', value: 'North' } });
      await openDropdown(component);
      should.not.exist(component.get('.btn-trash').attributes('disabled'));
    });

    it('is not disabled when there are pending selections', async () => {
      const component = mountComponent();
      await openDropdown(component);
      await component.get('.property-select').setValue('region');
      should.not.exist(component.get('.btn-trash').attributes('disabled'));
    });

    it('emits update:modelValue with null', async () => {
      const component = mountComponent({ modelValue: { property: 'region', value: 'North' } });
      await openDropdown(component);
      await component.get('.btn-trash').trigger('click');
      component.emitted('update:modelValue').should.eql([[null]]);
    });

    it('resets pending selections', async () => {
      const component = mountComponent({ modelValue: { property: 'region', value: 'North' } });
      await openDropdown(component);
      await component.get('.btn-trash').trigger('click');
      component.get('.property-select').element.value.should.equal('');
      component.get('.value-select').element.value.should.equal('');
    });
  });

  describe('dropdown re-open', () => {
    it('pre-populates pending fields from the active modelValue on open', async () => {
      const component = mountComponent({ modelValue: { property: 'region', value: 'North' } });
      await openDropdown(component);
      component.get('.property-select').element.value.should.equal('region');
      component.get('.value-select').element.value.should.equal('North');
    });

    it('starts with empty pending fields when modelValue is null', async () => {
      const component = mountComponent();
      await openDropdown(component);
      component.get('.property-select').element.value.should.equal('');
      component.get('.value-select').element.value.should.equal('');
    });
  });
});
