import ActorPropertiesNew from '../../../src/components/actor-properties/new.vue';
import ActorPropertiesUpsert from '../../../src/components/actor-properties/upsert.vue';
import EntityUpdateRow from '../../../src/components/entity/update/row.vue';

import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(ActorPropertiesUpsert, mergeMountOptions(options, {
    props: {
      propertyNames: ['prop1', 'prop2'],
      propertyValues: { prop1: 'value1', prop2: 'value2' }
    }
  }));

describe('ActorPropertiesUpsert', () => {
  it('renders a row for each property definition', () => {
    const component = mountComponent();
    const rows = component.findAllComponents(EntityUpdateRow);
    rows.length.should.equal(2);
  });

  it('passes the property name as the label', () => {
    const component = mountComponent();
    const rows = component.findAllComponents(EntityUpdateRow);
    rows[0].props().label.should.equal('prop1');
    rows[1].props().label.should.equal('prop2');
  });

  it('passes the old value from propertyValues', () => {
    const component = mountComponent();
    const rows = component.findAllComponents(EntityUpdateRow);
    rows[0].props().oldValue.should.equal('value1');
    rows[1].props().oldValue.should.equal('value2');
  });

  it('emits updated propertyValues when a row value changes', async () => {
    const component = mountComponent();
    const textareas = component.findAll('textarea');
    await textareas[0].setValue('newValue');
    const emitted = component.emitted('update:propertyValues');
    emitted[0][0].prop1.should.equal('newValue');
  });

  it('renders no rows when propertyNames is empty', () => {
    const component = mountComponent({
      props: { propertyNames: [], propertyValues: {} }
    });
    const rows = component.findAllComponents(EntityUpdateRow);
    rows.length.should.equal(0);
  });

  it('shows an empty state message when propertyNames is empty', () => {
    const component = mountComponent({
      props: { propertyNames: [], propertyValues: {} }
    });
    component.find('.actor-properties-empty').exists().should.be.true;
    component.find('.table').exists().should.be.false;
  });

  it('does not show the empty state message when there are properties', () => {
    const component = mountComponent();
    component.find('.actor-properties-empty').exists().should.be.false;
    component.find('.table').exists().should.be.true;
  });

  describe('+ Add Property', () => {
    it('shows ActorPropertiesNew when create is true', () => {
      const component = mountComponent({ props: { create: true } });
      component.findComponent(ActorPropertiesNew).exists().should.be.true;
    });

    it('shows ActorPropertiesNew in edit mode when create is false', () => {
      const component = mountComponent({ props: { create: false } });
      component.findComponent(ActorPropertiesNew).exists().should.be.true;
    });

    it('shows a new row when a property is added', async () => {
      const component = mountComponent({ props: { create: true } });
      await component.setProps({ propertyNames: [...component.props('propertyNames'), 'newprop'] });
      component.findAllComponents(EntityUpdateRow).length.should.equal(3);
    });
  });
});
