import Selectable from '../../../src/components/selectable.vue';
import OdataAnalyze from '../../../src/components/odata/analyze.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';


describe('DatasetEntities', () => {
  beforeEach(mockLogin);

  describe('OData modal', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
    });

    it('toggles the modal', () =>
      load('/projects/1/entity-lists/trees/entities', { root: false }).testModalToggles({
        modal: OdataAnalyze,
        show: '#odata-data-access-analyze-button',
        hide: '.btn-primary'
      }));

    it('shows the correct URL from entities page', async () => {
      const component = await load('/projects/1/entity-lists/trees/entities', {
        root: false
      });
      const text = component.getComponent(Selectable).text();
      text.should.equal(`${window.location.origin}/v1/projects/1/datasets/trees.svc`);
    });
  });

  describe('deleted entities', () => {
    it('does not show deleted entitiy button', async () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      const component = await load('/projects/1/entity-lists/trees/entities', {
        root: false
      });
      component.find('.toggle-deleted-entities').exists().should.be.false;
    });

    it('shows deleted entities button', async () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
      const component = await load('/projects/1/entity-lists/trees/entities', {
        root: false
      });
      const showDeletedButton = component.find('.toggle-deleted-entities');
      showDeletedButton.exists().should.be.true;
      showDeletedButton.text().should.equal('1 deleted Entity');
    });

    it('updates the deleted count on refresh', async () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/entity-lists/trees/entities', {
        root: false
      })
        .afterResponses((component) => {
          const showDeletedButton = component.find('.toggle-deleted-entities');
          showDeletedButton.text().should.equal('1 deleted Entity');
        })
        .request((component) => {
          component.find('#refresh-button').trigger('click');
        })
        .beforeAnyResponse(() => {
          testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
        })
        .respondWithData(() => testData.entityOData())
        .respondWithData(() => testData.entityDeletedOData())
        .afterResponses((component) => {
          const showDeletedButton = component.find('.toggle-deleted-entities');
          showDeletedButton.text().should.equal('2 deleted Entities');
        });
    });

    it('updates the url when deleted entities are shown', async () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/entity-lists/trees/entities')
        .complete()
        .request((component) => {
          const showDeletedButton = component.find('.toggle-deleted-entities');
          showDeletedButton.trigger('click');
        })
        .respondWithData(() => testData.entityDeletedOData())
        .afterResponses((component) => {
          const { deleted } = component.vm.$route.query;
          deleted.should.be.equal('true');
        });
    });

    it('disables the odata access button when deleted entities are shown', async () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/entity-lists/trees/entities')
        .complete()
        .request((component) =>
          component.find('.toggle-deleted-entities').trigger('click'))
        .respondWithData(() => testData.entityDeletedOData())
        .afterResponses((component) => {
          component.getComponent('#odata-data-access').props().analyzeDisabled.should.be.true;
        });
    });

    it('disables the download button when deleted entities are shown', async () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/entity-lists/trees/entities')
        .complete()
        .request((component) =>
          component.find('.toggle-deleted-entities').trigger('click'))
        .respondWithData(() => testData.entityDeletedOData())
        .afterResponses((component) => {
          component.find('#entity-download-button .btn-primary').classes().should.contain('disabled');
        });
    });
  });
});
