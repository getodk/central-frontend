import DateTime from '../../../src/components/date-time.vue';
import HoverCardDataset from '../../../src/components/hover-card/dataset.vue';

import useHoverCardResources from '../../../src/request-data/hover-card';

import testData from '../../data';
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
    const text = mountComponent().get('.hover-card-dataset-entities').text();
    text.should.equal('1,234');
  });

  it('shows the timestamp of the latest entity', () => {
    const lastEntity = new Date().toISOString();
    testData.extendedDatasets.createPast(1, { lastEntity });
    const component = mountComponent();
    const dateTime = component.get('.hover-card-dataset-last-entity')
      .getComponent(DateTime);
    dateTime.props().iso.should.equal(lastEntity);
  });

  it('shows the property count', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }, { name: 'circumference' }]
    });
    const component = mountComponent();
    const text = component.get('.hover-card-dataset-property-count').text();
    text.should.equal('2');
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
