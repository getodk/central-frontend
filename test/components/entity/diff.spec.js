import DiffItem from '../../../src/components/diff-item.vue';
import EntityDiff from '../../../src/components/entity/diff.vue';

import useEntity from '../../../src/request-data/entity';

import testData from '../../data';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => mount(EntityDiff, {
  props: { entityVersion: testData.extendedEntityVersions.last() },
  container: {
    requestData: testRequestData([useEntity], {
      entityVersions: testData.extendedEntityVersions.sorted()
    })
  }
});

describe('EntityDiff', () => {
  it('renders a DiffItem for each change', () => {
    testData.extendedEntities.createPast(1, {
      label: 'dogwood',
      data: { height: '1', circumference: '2' }
    });
    testData.extendedEntityVersions.createPast(1, {
      label: 'Dogwood',
      data: { height: '3', circumference: '4' }
    });
    const component = mountComponent();
    component.findAllComponents(DiffItem).length.should.equal(3);
  });

  it('passes the correct props to the DiffItem for a property change', () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '1' }
    });
    testData.extendedEntityVersions.createPast(1, {
      data: { height: '2' }
    });
    const component = mountComponent();
    const props = component.getComponent(DiffItem).props();
    props.new.should.equal('2');
    props.old.should.equal('1');
    props.path.should.eql(['height']);
  });

  it('passes the correct props to the DiffItem for a label change', () => {
    testData.extendedEntities.createPast(1, { label: 'dogwood' });
    testData.extendedEntityVersions.createPast(1, { label: 'Dogwood' });
    const component = mountComponent();
    const props = component.getComponent(DiffItem).props();
    props.new.should.equal('Dogwood');
    props.old.should.equal('dogwood');
    props.path.should.eql(['label']);
  });
});
