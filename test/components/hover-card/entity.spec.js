import DlData from '../../../src/components/dl-data.vue';
import HoverCardEntity from '../../../src/components/hover-card/entity.vue';

import useHoverCardResources from '../../../src/request-data/hover-card';

import { truncatesText } from '../../../src/util/dom';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) =>
  mount(HoverCardEntity, mergeMountOptions(options, {
    container: {
      requestData: testRequestData([useHoverCardResources], {
        dataset: testData.extendedDatasets.last(),
        entity: testData.standardEntities.last()
      })
    }
  }));

describe('HoverCardEntity', () => {
  describe('entity property data', () => {
    it('shows the first 5 properties', () => {
      testData.extendedEntities.createPast(1, {
        data: { p1: 'a', p2: 'b', p3: 'c', p4: 'd', p5: 'e', p6: 'f' }
      });
      const props = mountComponent().findAllComponents(DlData)
        .map(wrapper => wrapper.props());
      props.should.eql([
        { name: 'p1', value: 'a' },
        { name: 'p2', value: 'b' },
        { name: 'p3', value: 'c' },
        { name: 'p4', value: 'd' },
        { name: 'p5', value: 'e' }
      ]);
    });

    it('renders correctly if there are fewer than 5 properties', () => {
      testData.extendedEntities.createPast(1, {
        data: { p1: 'a', p2: 'b' }
      });
      const props = mountComponent().findAllComponents(DlData)
        .map(wrapper => wrapper.props());
      props.should.eql([
        { name: 'p1', value: 'a' },
        { name: 'p2', value: 'b' }
      ]);
    });

    it('truncates a long property name', () => {
      testData.extendedEntities.createPast(1, {
        data: { ['x'.repeat(1000)]: 'y' }
      });
      const component = mountComponent({ attachTo: document.body });
      const body = component.get('.hover-card-body');
      body.element.clientWidth.should.equal(288);
      const dt = body.get('.dl-data-dt');
      // The <dt> should get no more than 50% of the width of .hover-card-body.
      dt.element.clientWidth.should.equal(144);
      // It's not possible to mouse over a hover card in order to view a
      // tooltip, so this is the best way to assert text truncation.
      truncatesText(dt.element).should.be.true;
      body.get('.dl-data-dd').element.clientWidth.should.equal(144);
    });

    it('truncates a long property value', () => {
      testData.extendedEntities.createPast(1, {
        data: { x: 'y'.repeat(1000) }
      });
      const component = mountComponent({ attachTo: document.body });
      const body = component.get('.hover-card-body');
      body.element.clientWidth.should.equal(288);
      const dd = body.get('.dl-data-dd');
      // More than 50% of the width of .hover-card-body, but well short of 100%
      dd.element.clientWidth.should.be.within(180, 250);
      truncatesText(dd.get('div').element).should.be.true;
    });
  });
});
