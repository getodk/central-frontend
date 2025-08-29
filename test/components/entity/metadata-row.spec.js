import EntityMetadataRow from '../../../src/components/entity/metadata-row.vue';

import DateTime from '../../../src/components/date-time.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = (props = undefined) => {
  const mergedProps = {
    entity: props?.deleted
      ? testData.entityDeletedOData().value[0]
      : testData.entityOData().value[0],
    rowNumber: 1,
    verbs: new Set(testData.extendedUsers.first().verbs),
    ...props
  };
  return mount(EntityMetadataRow, {
    global: {
      provide: { projectId: '1', datasetName: 'trees' }
    },
    props: mergedProps,
    container: {
      router: mockRouter('/projects/1/entity-lists/trees/entities')
    }
  });
};

describe('EntityMetadataRow', () => {
  it('shows the row number', () => {
    testData.extendedDatasets.createPast(1);
    testData.extendedEntities.createPast(1);
    const td = mountComponent({ rowNumber: 1000 }).get('td');
    td.classes('row-number').should.be.true;
    td.text().should.equal('1000');
  });

  it('shows the creator name for an entity', async () => {
    testData.extendedDatasets.createPast(1);
    const creator = testData.extendedUsers.first();
    testData.extendedEntities.createPast(1, { creator }).last();
    const row = mountComponent();
    const td = row.findAll('td')[2];
    td.classes('creator-name').should.be.true;
    td.text().should.equal(creator.displayName);
    await td.get('span').should.have.textTooltip();
  });

  it('shows the creation date', () => {
    testData.extendedDatasets.createPast(1);
    const { createdAt } = testData.extendedEntities.createPast(1).last();
    mountComponent().getComponent(DateTime).props().iso.should.equal(createdAt);
  });

  describe('last updated date', () => {
    it('shows the date', () => {
      const { updatedAt } = testData.extendedEntities
        .createPast(1, { version: 2 })
        .last();
      should.exist(updatedAt);
      const dateTimes = mountComponent().findAllComponents(DateTime);
      dateTimes.length.should.equal(2);
      dateTimes[1].classes('updated-at').should.be.true;
      dateTimes[1].props().iso.should.equal(updatedAt);
    });

    it('does not show a date if there has not been an update', () => {
      testData.extendedEntities.createPast(1);
      mountComponent().get('.updated-at').text().should.equal('');
    });
  });

  describe('update count', () => {
    it('shows the count if there has been an update', () => {
      testData.extendedEntities.createPast(1, { version: 1001 });
      mountComponent().get('.updates').text().should.equal('1,000');
    });

    it('does not show the count if there has not been an update', () => {
      testData.extendedEntities.createPast(1);
      mountComponent().get('.updates').text().should.equal('');
    });
  });

  describe('conflict icon', () => {
    it('shows conflict icon if there is a conflict', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      mountComponent().find('.wrap-circle').exists().should.be.true;
    });

    it('does not show the count if there has not been an update', () => {
      testData.extendedEntities.createPast(1);
      mountComponent().find('.wrap-circle').exists().should.be.false;
    });
  });

  describe('buttons and roles', () => {
    it('renders the correct buttons for an administrator', () => {
      mockLogin();
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      mountComponent().findAll('.btn').length.should.equal(4);
    });

    it('renders the correct buttons for a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', datasets: 1 });
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      const btn = mountComponent().findAll('.btn');
      btn.length.should.equal(2);
      btn[0].classes('resolve-button').should.be.true;
      btn[1].classes('more-button').should.be.true;
    });
  });

  it('renders the edit button correctly', async () => {
    testData.extendedEntities.createPast(1, { version: 1001 });
    const button = mountComponent().get('.update-button');
    button.attributes('aria-label').should.equal('Edit (1,000)');
    await button.should.have.tooltip('Edit (1,000)');
  });

  it('renders the More button correctly', async () => {
    mockLogin();
    testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
    testData.extendedEntities.createPast(1, { uuid: 'e' });
    // Using load() rather than mountComponent() because RouterLinkStub doesn't
    // use the <router-link> slot.
    const app = await load('/projects/1/entity-lists/%C3%A1/entities');
    const btn = app.get('.entity-metadata-row .more-button');
    btn.element.tagName.should.equal('A');
    btn.attributes('target').should.equal('_blank');
    btn.attributes('href').should.equal('/projects/1/entity-lists/%C3%A1/entities/e');
  });

  describe('showing deleted entity', () => {
    it('shows the deleted date', () => {
      testData.extendedDatasets.createPast(1);
      const { deletedAt } = testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() }).last();
      mountComponent({ deleted: true }).get('.action-cell').getComponent(DateTime).props().iso.should.equal(deletedAt);
    });

    it('does not have delete button', () => {
      testData.extendedDatasets.createPast(1);
      testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() }).last();
      mountComponent({ deleted: true }).find('.delete-button').exists().should.be.false;
    });

    it('shows restore button', () => {
      testData.extendedDatasets.createPast(1);
      testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() }).last();
      mountComponent({ deleted: true }).find('.restore-button').attributes('aria-label').should.be.equal('Restore');
    });

    it('does not show the restore button if user does not have entity restore permission', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer' });
      testData.extendedDatasets.createPast(1);
      testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
      mountComponent({ deleted: true }).find('.restore-button').exists().should.be.false;
    });
  });
});
