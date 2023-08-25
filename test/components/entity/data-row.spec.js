import EntityDataRow from '../../../src/components/entity/data-row.vue';
import EntityTable from '../../../src/components/entity/table.vue';

import useProject from '../../../src/request-data/project';
import useEntities from '../../../src/request-data/entities';

import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';


const mountComponent = () => {
  // Mounting EntityTable in order to test tooltops on EntityDataRow
  // because text-overflow-ellipsis is defined for td and th on table.
  const table = mount(EntityTable, {
    global: {
      provide: { projectId: '1', datasetName: 'trees' }
    },
    props: {
      properties: testData.extendedDatasets.last().properties
    },
    container: {
      router: mockRouter('/projects/1/entity-lists/trees/entities/e'),
      requestData: testRequestData([useProject, useEntities], {
        project: testData.extendedProjects.last(),
        odataEntities: testData.entityOData()
      })
    }
  });
  return table.getComponent(EntityDataRow);
};

describe('EntityDataRow', () => {
  it('shows an empty string if the value of a property does not exist', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [{ name: 'height' }]
    });
    testData.extendedEntities.createPast(1, { data: {} });

    const td = mountComponent().get('td');
    td.text().should.equal('');
  });

  it('shows the entity label and UUID', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [{ name: 'height' }]
    });
    testData.extendedEntities.createPast(1, { label: 'foo', uuid: 'abcd1234' });
    const td = mountComponent().findAll('td');
    td.length.should.equal(3);
    td[1].text().should.equal('foo');
    td[2].text().should.equal('abcd1234');
  });

  it('renders a cell for each property', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [
        { name: 'height' },
        { name: 'circumference' }
      ]
    });
    testData.extendedEntities.createPast(1, {
      label: 'foo',
      uuid: 'abcd1234',
      data: { height: '444', circumference: '555' }
    });
    const text = mountComponent().findAll('td').map(td => td.text());
    text.should.eql(['444', '555', 'foo', 'abcd1234']);
  });

  it('renders tooltip span for a long value', async () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [
        { name: 'p1' }
      ]
    });
    testData.extendedEntities.createPast(1, {
      label: 'foo',
      uuid: 'abcd1234',
      data: { p1: 'foobar' }
    });
    const td = mountComponent().get('td');
    td.classes().length.should.equal(0);
    const span = td.get('span');
    span.text().should.equal('foobar');
    await span.should.have.textTooltip();
  });

  it('uses the odataName of the property', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'circumference.cm', odataName: 'circumference_cm' }],
      entities: 1
    });
    testData.extendedEntities.createPast(1, {
      data: { 'circumference.cm': '555' }
    });
    mountComponent().get('td').text().should.equal('555');
  });
});
