import EntityDataRow from '../../../src/components/entity/data-row.vue';
import EntityTable from '../../../src/components/entity/table.vue';

import useProject from '../../../src/request-data/project';
import useEntities from '../../../src/request-data/entities';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = (props = undefined) => {
  const container = createTestContainer({
    requestData: testRequestData([useProject, useEntities], {
      project: testData.extendedProjects.last(),
      odataEntities: {
        status: 200,
        data: testData.entityOData(),
        config: {
          url: '/v1/projects/1/datasets/trees/Entities'
        }
      }
    })
  });
  // Mounting EntityTable because SubmissionTable did the same thing for
  // SubmissionDataRow.
  const table = mount(EntityTable, {
    props: {
      properties: testData.extendedDatasets.last().properties,
      ...props
    },
    container
  });
  return table.getComponent(EntityDataRow);
};

describe('EntityDataRow', () => {
  it('shows an empty string if the value of a property does not exist', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [{ name: 'height' }]
    });
    testData.extendedEntities.createPast(1, { height: null });

    const td = mountComponent().get('td');
    td.text().should.equal('');
  });

  it('shows the entity label and UUID', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [{ name: 'height' }]
    });
    testData.extendedEntities.createPast(1, { label: 'foo', entityId: 'abcd1234' });
    const td = mountComponent().findAll('td');
    td.length.should.equal(3);
    td[1].text().should.equal('foo');
    td[2].text().should.equal('abcd1234');
  });

  it('renders a cell for each field', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [
        { name: 'height' },
        { name: 'circumference' }
      ]
    });
    testData.extendedEntities.createPast(1, {
      label: 'foo',
      entityId: 'abcd1234',
      height: '444',
      circumference: '555'
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
      entityId: 'abcd1234',
      p1: 'foobar'
    });
    const td = mountComponent().get('td');
    td.classes().length.should.equal(0);
    const span = td.get('span');
    span.text().should.equal('foobar');
    await span.should.have.textTooltip();
  });
});
