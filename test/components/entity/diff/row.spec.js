import { last } from 'ramda';

import EntityDiffRow from '../../../../src/components/entity/diff/row.vue';

import useEntity from '../../../../src/request-data/entity';

import createTestContainer from '../../../util/container';
import testData from '../../../data';
import { mergeMountOptions, mount } from '../../../util/lifecycle';
import { testRequestData } from '../../../util/request-data';

const mountComponent = (options) => {
  const container = createTestContainer({
    requestData: testRequestData([useEntity], {
      entityVersions: testData.extendedEntityVersions.sorted()
    })
  });
  const { entityVersions } = container.requestData.localResources;
  return mount(EntityDiffRow, mergeMountOptions(options, {
    global: {
      provide: { entityVersion: last(entityVersions) }
    },
    props: { oldVersion: entityVersions[0] }
  }));
};

describe('EntityDiffRow', () => {
  describe('first column', () => {
    it('shows the correct text for a label', () => {
      testData.extendedEntities.createPast(1, { label: 'dogwood' });
      testData.extendedEntityVersions.createPast(1, { label: 'Dogwood' });
      const row = mountComponent({
        props: { name: 'label' }
      });
      row.get('td').text().should.equal('Label');
    });

    it('renders a property correctly', async () => {
      testData.extendedEntities.createPast(1, {
        data: { height: '1' }
      });
      testData.extendedEntityVersions.createPast(1, {
        data: { height: '2' }
      });
      const row = mountComponent({
        props: { name: 'height' }
      });
      const td = row.get('td');
      td.text().should.equal('height');
      await td.should.have.textTooltip();
      td.classes('property').should.be.true();
    });
  });

  describe('old value', () => {
    it('shows an old label', () => {
      testData.extendedEntities.createPast(1, { label: 'dogwood' });
      testData.extendedEntityVersions.createPast(1, { label: 'Dogwood' });
      const row = mountComponent({
        props: { name: 'label' }
      });
      row.get('td:nth-child(2)').text().should.equal('dogwood');
    });

    it('shows the old value of a property', () => {
      testData.extendedEntities.createPast(1, {
        data: { height: '111111' }
      });
      testData.extendedEntityVersions.createPast(1, {
        data: { height: '222222' }
      });
      const row = mountComponent({
        props: { name: 'height' }
      });
      row.get('td:nth-child(2)').text().should.equal('111111');
    });

    it('renders correctly if the old value is an empty string', () => {
      testData.extendedEntities.createPast(1, {
        data: { height: '' }
      });
      testData.extendedEntityVersions.createPast(1, {
        data: { height: '1' }
      });
      const row = mountComponent({
        props: { name: 'height' }
      });
      const td = row.get('td:nth-child(2)');
      td.text().should.equal('(empty)');
      td.classes('empty').should.be.true();
    });

    it('renders correctly if the old value does not exist', () => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'height' }],
        entities: 1
      });
      testData.extendedEntities.createPast(1, { data: {} });
      testData.extendedEntityVersions.createPast(1, {
        data: { height: '1' }
      });
      const row = mountComponent({
        props: { name: 'height' }
      });
      const td = row.get('td:nth-child(2)');
      td.text().should.equal('(empty)');
      td.classes('empty').should.be.true();
    });
  });

  describe('new value', () => {
    it('shows a new label', () => {
      testData.extendedEntities.createPast(1, { label: 'dogwood' });
      testData.extendedEntityVersions.createPast(1, { label: 'Dogwood' });
      const row = mountComponent({
        props: { name: 'label' }
      });
      row.get('td:nth-child(4)').text().should.equal('Dogwood');
    });

    it('shows the new value of a property', () => {
      testData.extendedEntities.createPast(1, {
        data: { height: '111111' }
      });
      testData.extendedEntityVersions.createPast(1, {
        data: { height: '222222' }
      });
      const row = mountComponent({
        props: { name: 'height' }
      });
      row.get('td:nth-child(4)').text().should.equal('222222');
    });

    it('renders correctly if the new value is an empty string', () => {
      testData.extendedEntities.createPast(1, {
        data: { height: '1' }
      });
      testData.extendedEntityVersions.createPast(1, {
        data: { height: '' }
      });
      const row = mountComponent({
        props: { name: 'height' }
      });
      const td = row.get('td:nth-child(4)');
      td.text().should.equal('(empty)');
      td.classes('empty').should.be.true();
    });
  });

  it('renders correctly if the property is conflicting', async () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '1' }
    });
    testData.extendedEntityVersions.createPast(1, {
      data: { height: '2' }
    });
    testData.extendedEntityVersions.createPast(1, {
      baseVersion: 1,
      data: { height: '3' },
      conflictingProperties: ['height']
    });
    const row = mountComponent({
      props: { name: 'height' }
    });
    row.get('td').classes('conflicting').should.be.true();
    const iconContainer = row.get('td:nth-child(3) span');
    iconContainer.find('.icon-exclamation-circle').exists().should.be.true();
    await iconContainer.should.have.tooltip('Another update already wrote to this property.');
    const text = row.get('.sr-only').text();
    await text.should.equal('Another update already wrote to this property.');
  });
});
