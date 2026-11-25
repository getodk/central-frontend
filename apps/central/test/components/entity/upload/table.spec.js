import { pick } from 'ramda';

import EntityUploadTable from '../../../../src/components/entity/upload/table.vue';
import useUploadEntities from '../../../../src/request-data/upload-entities';

import testData from '../../../data';
import { mergeMountOptions, mount } from '../../../util/lifecycle';
import { testRequestData } from '../../../util/request-data';

const mountComponent = (options = {}) => {
  const mergedOptions = mergeMountOptions(options, {
    props: { pageSize: 5 },
    container: {
      requestData: testRequestData([useUploadEntities], {
        dataset: testData.extendedDatasets.last()
      })
    }
  });

  const { props } = mergedOptions;
  if (props.entities == null && testData.extendedEntities.size !== 0) {
    if (props.rowIndex == null) props.rowIndex = 0;
    props.entities = testData.extendedEntities.sorted()
      .reverse()
      .slice(props.rowIndex, props.rowIndex + props.pageSize)
      .map(entity => pick(['label', 'data'], entity.currentVersion));
  }
  if (props.rowIndex == null) props.rowIndex = props.entities != null ? 0 : -1;

  return mount(EntityUploadTable, mergedOptions);
};

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
    mountComponent().find('tbody').exists().should.be.false;
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
      props: { rowIndex: 1000 }
    });
    component.get('.row-number').text().should.equal('1001');
  });

  it('shows the label', async () => {
    testData.extendedEntities.createPast(1, { label: 'dogwood' });
    const div = mountComponent().get('td:nth-child(2) .new-value');
    div.text().should.equal('dogwood');
    await div.should.have.textTooltip();
  });

  it('shows data for each property', async () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '123456', circumference: '999' }
    });
    const td = mountComponent().findAll('td');
    td.length.should.equal(4);
    const divs = td.slice(2).map(wrapper => wrapper.get('.new-value'));
    divs[0].text().should.equal('123456');
    divs[1].text().should.equal('999');
    await divs[0].should.have.textTooltip();
  });

  describe('serverEntities', () => {
    describe('label', () => {
      [
        {
          serverLabel: 'dogwood',
          csvLabel: 'Dogwood',
          changed: true,
          oldValue: true
        },
        {
          serverLabel: 'dogwood',
          csvLabel: 'dogwood',
          changed: false,
          oldValue: false
        },
        {
          serverLabel: 'dogwood',
          csvLabel: undefined,
          changed: false,
          oldValue: true
        }
      ].forEach(({ serverLabel, csvLabel, changed, oldValue: hasOld }) => {
        it(`renders correctly if label was changed from ${JSON.stringify(serverLabel)} to ${JSON.stringify(csvLabel)}`, async () => {
          testData.extendedEntities.createPast(1, { uuid: 'e', label: serverLabel });
          const component = mountComponent({
            props: {
              entities: [{ uuid: 'e', label: csvLabel, data: {} }]
            },
            container: {
              requestData: { serverEntities: testData.entityOData() }
            },
            attachTo: document.body
          });

          const td = component.get('td:nth-child(2)');
          td.find('.changed').exists().should.equal(changed);

          const oldValue = td.find('.old-value');
          oldValue.exists().should.equal(hasOld);
          if (hasOld) {
            oldValue.text().should.equal(serverLabel);
            await oldValue.should.have.tooltip(oldValue.text());
          }

          const newValue = td.get('.new-value');
          newValue.text().should.equal(csvLabel ?? '');
          if (newValue.text() === '') newValue.should.be.hidden(true);
        });
      });
    });

    describe('property data', () => {
      beforeEach(() => {
        testData.extendedDatasets.createPast(1, {
          properties: [{ name: 'height' }]
        });
      });

      [
        {
          serverData: { height: '1' },
          csvData: { height: '2' },
          changed: true,
          oldValue: true
        },
        {
          serverData: { height: '1' },
          csvData: { height: '1' },
          changed: false,
          oldValue: false
        },
        {
          serverData: {},
          csvData: { height: '1' },
          changed: true,
          oldValue: true
        },
        {
          serverData: { height: '1' },
          csvData: {},
          changed: false,
          oldValue: true
        },
        {
          serverData: {},
          csvData: {},
          changed: false,
          oldValue: false
        },
        {
          serverData: { height: '' },
          csvData: {},
          changed: false,
          oldValue: true
        },
        {
          serverData: {},
          csvData: { height: '' },
          changed: true,
          oldValue: true
        },
        {
          serverData: { height: '' },
          csvData: { height: '' },
          changed: false,
          oldValue: false
        }
      ].forEach(({ serverData, csvData, changed, oldValue: hasOld }) => {
        it(`renders correctly if property data was changed from ${JSON.stringify(serverData)} to ${JSON.stringify(csvData)}`, async () => {
          testData.extendedEntities
            .createPast(1, { uuid: 'e', label: 'dogwood', data: serverData });
          const component = mountComponent({
            props: {
              entities: [{ uuid: 'e', label: 'dogwood', data: csvData }]
            },
            container: {
              requestData: { serverEntities: testData.entityOData() }
            },
            attachTo: document.body
          });

          const td = component.get('td:nth-child(3)');
          td.find('.changed').exists().should.equal(changed);

          const oldValue = td.find('.old-value');
          oldValue.exists().should.equal(hasOld);
          if (hasOld) {
            oldValue.text().should.equal(serverData.height ?? '');
            if (oldValue.text() === '')
              oldValue.should.be.hidden(true);
            else
              await oldValue.should.have.tooltip(oldValue.text());
          }

          const newValue = td.get('.new-value');
          newValue.text().should.equal(csvData.height ?? '');
          if (newValue.text() === '') newValue.should.be.hidden(true);
        });
      });
    });

    it('renders an unknown entity correctly', () => {
      testData.extendedDatasets.createPast(1);
      const component = mountComponent({
        props: {
          entities: [{ uuid: 'e', label: 'dogwood', data: {} }]
        },
        container: {
          requestData: { serverEntities: testData.entityOData() }
        }
      });
      component.get('tbody tr').classes('error').should.be.true;
    });
  });

  it('shows extra properties in the CSV data', async () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }]
    });
    const component = mountComponent({
      props: {
        entities: [{
          label: 'dogwood',
          data: { height: '1' },
          extra: { circumference: '123456', species: 'dogwood' }
        }],
        extraProperties: ['circumference', 'species']
      }
    });

    const th = component.findAll('th');
    const thText = th.map(wrapper => wrapper.text());
    thText.should.eql(['Row', 'label', 'height', 'circumference', 'species']);
    await th[3].get('div').should.have.textTooltip();

    const td = component.findAll('td');
    td.length.should.equal(5);
    const divs = td.slice(3).map(wrapper => wrapper.get('.new-value'));
    divs[0].text().should.equal('123456');
    divs[1].text().should.equal('dogwood');
    await divs[0].should.have.textTooltip();
  });

  it('highlights rows in the highlighted range', () => {
    testData.extendedDatasets.createPast(1, { entities: 12 });
    testData.extendedEntities.createPast(12);
    const component = mountComponent({
      props: { rowIndex: 5, highlighted: [8, 10] }
    });
    const tr = component.findAll('tbody tr');
    const highlighted = tr.map(wrapper => wrapper.classes('highlight'));
    highlighted.should.eql([false, false, false, true, true]);
  });
});
