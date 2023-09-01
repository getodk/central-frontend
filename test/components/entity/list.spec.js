import DateTime from '../../../src/components/date-time.vue';
import EntityDataRow from '../../../src/components/entity/data-row.vue';
import EntityList from '../../../src/components/entity/list.vue';
import EntityMetadataRow from '../../../src/components/entity/metadata-row.vue';
import EntityUpdate from '../../../src/components/entity/update.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('EntityList', () => {
  beforeEach(mockLogin);

  it('sends the correct requests for a dataset', () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    return load(
      '/projects/1/entity-lists/trees/entities',
      { root: false }
    ).testRequests([
      { url: '/v1/projects/1/datasets/trees.svc/Entities?%24count=true' }
    ]);
  });

  it('shows a message if there are no submissions', async () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    const component = await load(
      '/projects/1/entity-lists/trees/entities',
      { root: false }
    );
    component.getComponent(EntityList).get('.empty-table-message').should.be.visible();
  });

  describe('after the refresh button is clicked', () => {
    it('completes a background refresh', () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      const assertRowCount = (count) => (component) => {
        component.findAllComponents(EntityMetadataRow).length.should.equal(count);
        component.findAllComponents(EntityDataRow).length.should.equal(count);
      };
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .afterResponses(assertRowCount(1))
        .request(component =>
          component.get('#entity-list-refresh-button').trigger('click'))
        .beforeEachResponse(assertRowCount(1))
        .respondWithData(() => {
          testData.extendedEntities.createNew();
          return testData.entityOData();
        })
        .afterResponse(assertRowCount(2));
    });

    it('does not show a loading message', () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .complete()
        .request(component =>
          component.get('#entity-list-refresh-button').trigger('click'))
        .beforeEachResponse(component => {
          component.get('.loading').should.be.hidden();
        })
        .respondWithData(testData.entityOData);
    });
  });

  describe('update', () => {
    it('toggles the Modal', () => {
      testData.extendedEntities.createPast(1);
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .testModalToggles({
          modal: EntityUpdate,
          show: '.entity-metadata-row .update-button',
          hide: ['.btn-link']
        });
    });

    it('passes the correct entity to the modal', async () => {
      testData.extendedEntities
        .createPast(1, { uuid: 'e1' })
        .createPast(1, { uuid: 'e2' });
      const component = await load('/projects/1/entity-lists/trees/entities', {
        root: false
      });
      const modal = component.getComponent(EntityUpdate);
      should.not.exist(modal.props().entity);
      const buttons = component.findAll('.entity-metadata-row .update-button');
      buttons.length.should.equal(2);
      await buttons[0].trigger('click');
      modal.props().entity.uuid.should.equal('e2');
      await modal.get('.btn-link').trigger('click');
      await buttons[1].trigger('click');
      modal.props().entity.uuid.should.equal('e1');
    });

    it('passes a REST-format entity to the modal', async () => {
      testData.extendedDatasets.createPast(1, {
        properties: [
          { name: 'height' },
          { name: 'circumference.cm', odataName: 'circumference_cm' }
        ]
      });
      testData.extendedEntities.createPast(1, {
        uuid: 'abc',
        label: 'My Entity',
        data: { height: '1', 'circumference.cm': '2' }
      });
      const component = await load('/projects/1/entity-lists/trees/entities', {
        root: false
      });
      await component.get('.entity-metadata-row .update-button').trigger('click');
      component.getComponent(EntityUpdate).props().entity.should.eql({
        uuid: 'abc',
        currentVersion: {
          label: 'My Entity',
          version: 1,
          data: Object.assign(Object.create(null), {
            height: '1',
            'circumference.cm': '2'
          })
        }
      });
    });

    it('does not show the modal during a refresh of the table', () => {
      testData.extendedEntities.createPast(1);
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .complete()
        .request(component =>
          component.get('#entity-list-refresh-button').trigger('click'))
        .beforeEachResponse(async (component) => {
          await component.get('.entity-metadata-row .update-button').trigger('click');
          component.getComponent(EntityUpdate).props().state.should.be.false();
        })
        .respondWithData(testData.entityOData)
        .afterResponse(component => {
          component.getComponent(EntityUpdate).props().state.should.be.false();
        });
    });

    describe('after a successful response', () => {
      const submit = () => {
        testData.extendedDatasets.createPast(1, {
          properties: [
            { name: 'height' },
            { name: 'circumference.cm', odataName: 'circumference_cm' }
          ]
        });
        testData.extendedEntities.createPast(1, { uuid: 'e1' });
        testData.extendedEntities.createPast(1, {
          uuid: 'e2',
          label: 'My Entity',
          data: { height: '1', 'circumference.cm': '2' }
        });
        testData.extendedEntities.createPast(1, { uuid: 'e3' });
        return load('/projects/1/entity-lists/trees/entities', { root: false })
          .complete()
          .request(async (component) => {
            await component.get('.entity-metadata-row:nth-child(2) .update-button').trigger('click');
            const form = component.get('#entity-update form');
            const textareas = form.findAll('textarea');
            textareas.length.should.equal(3);
            await textareas[0].setValue('Updated Entity');
            await textareas[1].setValue('3');
            await textareas[2].setValue('4');
            return form.trigger('submit');
          })
          .respondWithData(() => {
            const { currentVersion } = testData.extendedEntities.get(1);
            testData.extendedEntities.update(1, {
              currentVersion: {
                ...currentVersion,
                label: 'Updated Entity',
                data: { height: '3', 'circumference.cm': '4' }
              }
            });
            return testData.standardEntities.get(1);
          });
      };

      it('hides the modal', async () => {
        const component = await submit();
        component.getComponent(EntityUpdate).props().state.should.be.false();
      });

      it('shows a success alert', async () => {
        const component = await submit();
        component.should.alert('success');
      });

      it('updates the EntityDataRow', async () => {
        const component = await submit();
        const tds = component.findAll('.entity-data-row:nth-child(2) td');
        tds.map(td => td.text()).should.eql(['3', '4', 'Updated Entity', 'e2']);
      });

      it('updates the EntityMetadataRow', async () => {
        const component = await submit();
        const td = component.get('.entity-metadata-row:nth-child(2) td:last-child');
        should.exist(td.getComponent(DateTime).props().iso);
        td.get('.updates').text().should.equal('1');
        td.get('.update-button').attributes('aria-label').should.equal('Edit (1)');
      });
    });
  });
});
