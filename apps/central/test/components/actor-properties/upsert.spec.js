import { nextTick } from 'vue';

import ActorPropertiesUpsert from '../../../src/components/actor-properties/upsert.vue';
import EntityUpdateRow from '../../../src/components/entity/update/row.vue';

import testData from '../../data';
import { addActorProperty } from '../../util/trigger';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = async (options = undefined) => {
  const actorProperties = testData.actorProperties.sorted();

  // Default propertyValues
  const propertyValues = Object.create(null);
  const propertyNames = actorProperties.map(({ name }) => name);
  if (propertyNames.includes('prop1')) propertyValues.prop1 = 'value1';
  if (propertyNames.includes('prop2')) propertyValues.prop2 = 'value2';

  const component = mount(ActorPropertiesUpsert, mergeMountOptions(options, {
    props: { propertyValues },
    container: {
      requestData: testRequestData(['actorProperties'], { actorProperties })
    }
  }));

  // Give the component a chance to emit its initial update:propertyValues.
  await nextTick();
  const emitted = component.emitted('update:propertyValues');
  emitted.should.eql([[Object.create(null)]]);
  await component.setProps({ propertyValues: emitted[0][0] });

  return component;
};

describe('ActorPropertiesUpsert', () => {
  beforeEach(() => {
    testData.actorProperties.createPast(1, { name: 'prop1' })
      .createPast(1, { name: 'prop2' });
  });

  it('renders a row for each property definition', async () => {
    const component = await mountComponent();
    const rows = component.findAllComponents(EntityUpdateRow);
    rows.length.should.equal(2);
  });

  it('passes the property name as the label', async () => {
    const component = await mountComponent();
    const rows = component.findAllComponents(EntityUpdateRow);
    rows[0].props().label.should.equal('prop1');
    rows[1].props().label.should.equal('prop2');
  });

  it('passes the old value from propertyValues', async () => {
    const component = await mountComponent();
    const rows = component.findAllComponents(EntityUpdateRow);
    rows[0].props().oldValue.should.equal('value1');
    rows[1].props().oldValue.should.equal('value2');
  });

  it('mutates propertyValues when a row value changes', async () => {
    const component = await mountComponent();
    // The component emits an event initially.
    component.emitted('update:propertyValues').length.should.equal(1);

    const textareas = component.findAll('textarea');
    await textareas[0].setValue('newValue');
    // No additional event is emitted.
    component.emitted('update:propertyValues').length.should.equal(1);
    // Instead, the prop is mutated directly.
    component.props().propertyValues.prop1.should.equal('newValue');
  });

  it('renders no rows when propertyNames is empty', async () => {
    testData.actorProperties.reset();
    const component = await mountComponent();
    const rows = component.findAllComponents(EntityUpdateRow);
    rows.length.should.equal(0);
  });

  it('shows an empty state message when propertyNames is empty', async () => {
    testData.actorProperties.reset();
    const component = await mountComponent();
    component.find('.actor-properties-empty').exists().should.be.true;
    component.find('.table').exists().should.be.false;
  });

  it('does not show the empty state message when there are properties', async () => {
    const component = await mountComponent();
    component.find('.actor-properties-empty').exists().should.be.false;
    component.find('.table').exists().should.be.true;
  });

  it('shows a new row when a property is added', async () => {
    const component = await mountComponent();
    await addActorProperty(component, 'newprop');
    const rows = component.findAllComponents(EntityUpdateRow);
    rows.length.should.equal(3);
    rows[2].get('label').text().should.equal('newprop');
  });

  it('is disabled if the disabled prop is true', async () => {
    const component = await mountComponent({
      props: { disabled: true }
    });
    component.get('fieldset').should.be.disabled();
  });
});
