import { pick } from 'ramda';

import EntityUploadTable from '../../../../src/components/entity/upload/table.vue';

import testData from '../../../data';
import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options) =>
  mount(EntityUploadTable, mergeMountOptions(options, {
    props: {
      entities: testData.extendedEntities.size === 0
        ? null
        : testData.extendedEntities.sorted().reverse()
          .map(entity => pick(['label', 'data'], entity.currentVersion)),
      rowIndex: testData.extendedEntities.size === 0 ? -1 : 0,
      pageSize: 5
    },
    container: {
      requestData: { dataset: testData.extendedDatasets.last() }
    }
  }));

describe('EntityUploadTable', () => {
  it('shows a column header for each property', async () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }, { name: 'circumference' }]
    });
    const th = mountComponent().findAll('th');
    const text = th.map(wrapper => wrapper.text());
    text.should.eql(['Row', 'label', 'height', 'circumference']);
    await th[2].get('div').should.have.textTooltip();
  });

  it('does not render data if the entities prop is nullish', () => {
    testData.extendedDatasets.createPast(1);
    mountComponent().find('tbody').exists().should.be.false();
  });

  it('shows a row for each entity', () => {
    testData.extendedDatasets.createPast(1, { entities: 2 });
    testData.extendedEntities.createPast(2);
    mountComponent().findAll('tbody tr').length.should.equal(2);
  });

  it('shows the row number', () => {
    testData.extendedDatasets.createPast(1, { entities: 2 });
    testData.extendedEntities.createPast(2);
    const td = mountComponent().findAll('.row-number');
    td.map(wrapper => wrapper.text()).should.eql(['1', '2']);
  });

  it('uses the rowIndex prop', () => {
    testData.extendedDatasets.createPast(1, { entities: 1001 });
    testData.extendedEntities.createPast(1001);
    const component = mountComponent({
      props: {
        entities: [testData.extendedEntities.last()],
        rowIndex: 1000
      }
    });
    component.get('.row-number').text().should.equal('1001');
  });

  it('shows the label', async () => {
    testData.extendedEntities.createPast(1, { label: 'dogwood' });
    const div = mountComponent().get('td:nth-child(2) div');
    div.text().should.equal('dogwood');
    await div.should.have.textTooltip();
  });

  it('shows data for each property', async () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '123456', circumference: '999' }
    });
    const td = mountComponent().findAll('td');
    td.length.should.equal(4);
    const divs = td.slice(2).map(wrapper => wrapper.get('div'));
    divs[0].text().should.equal('123456');
    divs[1].text().should.equal('999');
    await divs[0].should.have.textTooltip();
  });
});
