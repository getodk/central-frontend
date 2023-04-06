import EntityData from '../../../src/components/entity/data.vue';

import useEntity from '../../../src/request-data/entity';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => mount(EntityData, {
  container: {
    requestData: testRequestData([useEntity], {
      dataset: testData.extendedDatasets.last(),
      entity: testData.extendedEntities.last()
    })
  }
});

describe('EntityData', () => {
  beforeEach(mockLogin);

  it('does not render if there are no properties', () => {
    testData.extendedDatasets.createPast(1, { properties: [], entities: 1 });
    testData.extendedEntities.createPast(1);
    mountComponent().find('*').exists().should.be.false();
  });

  it('renders an item for each property', () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '1', circumference: '2' }
    });
    mountComponent().findAll('dl > div').length.should.equal(2);
  });

  it('renders a property correctly', async () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '123456' }
    });
    const component = mountComponent();
    const dt = component.get('dt');
    dt.text().should.equal('height');
    await dt.get('span').should.have.textTooltip();
    const dd = component.get('dd');
    dd.text().should.equal('123456');
    await dd.get('span').should.have.textTooltip();
  });

  it('shows (empty) if the value of a property is an empty string', () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '' }
    });
    mountComponent().get('dd span').text().should.equal('(empty)');
  });

  it('shows (empty) if the value of a property does not exist', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }],
      entities: 1
    });
    testData.extendedEntities.createPast(1, { data: {} });
    mountComponent().get('dd span').text().should.equal('(empty)');
  });
});
