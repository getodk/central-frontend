import ActorPropertiesUpsert from '../../../src/components/actor-properties/upsert.vue';
import EntityUpdateRow from '../../../src/components/entity/update/row.vue';

import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(ActorPropertiesUpsert, mergeMountOptions(options, {
    props: {
      propertyDefs: [{ name: 'prop1' }, { name: 'prop2' }],
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

  it('renders no rows when propertyDefs is empty', () => {
    const component = mountComponent({
      props: { propertyDefs: [], propertyValues: {} }
    });
    const rows = component.findAllComponents(EntityUpdateRow);
    rows.length.should.equal(0);
  });
});
