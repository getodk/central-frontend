import DateTime from '../../../src/components/date-time.vue';
import HoverCardDataset from '../../../src/components/hover-card/dataset.vue';

import useHoverCardResources from '../../../src/request-data/hover-card';

import testData from '../../data';
import { findDd } from '../../util/dom';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => mount(HoverCardDataset, {
  container: {
    requestData: testRequestData([useHoverCardResources], {
      dataset: testData.extendedDatasets.last()
    })
  }
});

describe('HoverCardDataset', () => {
  it('shows the name of the entity list', () => {
    testData.extendedDatasets.createPast(1);
    mountComponent().get('.hover-card-title').text().should.equal('trees');
  });

  it('shows the entity count', () => {
    testData.extendedDatasets.createPast(1, { entities: 1234 });
    findDd(mountComponent(), 'Entities').text().should.equal('1,234');
  });

  it('shows the property count', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }, { name: 'circumference' }]
    });
    findDd(mountComponent(), 'Properties').text().should.equal('2');
  });

  it('shows the timestamp of the latest entity', () => {
    const lastEntity = new Date().toISOString();
    testData.extendedDatasets.createPast(1, { lastEntity });
    const dd = findDd(mountComponent(), 'Latest Entity');
    dd.getComponent(DateTime).props().iso.should.equal(lastEntity);
  });

  it('shows the property list', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }, { name: 'circumference' }]
    });
    const component = mountComponent();
    const text = component.findAll('.hover-card-dataset-property-list div')
      .map(div => div.text());
    text.should.eql(['height', 'circumference']);
  });
});
