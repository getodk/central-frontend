import DateTime from '../../../src/components/date-time.vue';
import EntityDataRow from '../../../src/components/entity/data-row.vue';
import EntityList from '../../../src/components/entity/list.vue';
import EntityMetadataRow from '../../../src/components/entity/metadata-row.vue';
import EntityUpdate from '../../../src/components/entity/update.vue';
import Spinner from '../../../src/components/spinner.vue';

import testData from '../../data';
import { mockResponse } from '../../util/axios';
import { loadEntityList } from '../../util/entity';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

// Create entities along with the associated project and dataset.
const createEntities = (count, factoryOptions = {}) => {
  testData.extendedProjects.createPast(1);
  testData.extendedDatasets.createPast(1, { entities: count });
  testData.extendedEntities.createPast(count, factoryOptions);
};
const _scroll = (component, scrolledToBottom) => {
  const method = component.vm.scrolledToBottom;
  if (method == null) {
    _scroll(component.getComponent(EntityList), scrolledToBottom);
    return;
  }
  // eslint-disable-next-line no-param-reassign
  component.vm.scrolledToBottom = () => scrolledToBottom;
  document.dispatchEvent(new Event('scroll'));
  // eslint-disable-next-line no-param-reassign
  component.vm.scrolledToBottom = method;
};
// eslint-disable-next-line consistent-return
const scroll = (componentOrBoolean) => {
  if (componentOrBoolean === true || componentOrBoolean === false)
    return (component) => _scroll(component, componentOrBoolean);
  _scroll(componentOrBoolean, true);
};

describe('EntityList', () => {
  beforeEach(mockLogin);

  it('sends the correct requests for a dataset', () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    return load(
      '/projects/1/entity-lists/trees/entities',
      { root: false }
    ).testRequests([
      { url: '/v1/projects/1/datasets/trees.svc/Entities?%24top=250&%24count=true' }
    ]);
  });

  it('shows a message if there are no entities', async () => {
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
          component.get('#odata-loading-message').should.be.hidden();
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

  describe('infinite loading', () => {
    const checkTop = ({ url }, top) => {
      url.should.match(new RegExp(`[?&]%24top=${top}(&|$)`));
    };
    const checkIds = (component, count, offset = 0) => {
      const rows = component.findAllComponents(EntityDataRow);
      rows.length.should.equal(count);
      const entities = testData.extendedEntities.sorted();
      entities.length.should.be.aboveOrEqual(count + offset);
      for (let i = 0; i < rows.length; i += 1) {
        const text = rows[i].get('td:last-child').text();
        text.should.equal(entities[i + offset].uuid);
      }
    };
    const checkMessage = (component, text) => {
      const message = component.get('#odata-loading-message');
      if (text == null) {
        message.should.be.hidden();
      } else {
        message.should.not.be.hidden();
        message.get('#odata-loading-message-text').text().should.equal(text);

        const spinner = component.findAllComponents(Spinner).find(wrapper =>
          message.element.contains(wrapper.element));
        spinner.props().state.should.be.true();
      }
    };

    it('loads a single entity', () => {
      createEntities(1);
      return loadEntityList()
        .beforeEachResponse((component, { url }) => {
          if (url.includes('.svc/Entities'))
            checkMessage(component, 'Loading 1 Entity…');
        });
    });

    it('loads all entities if there are few of them', () => {
      createEntities(2);
      return loadEntityList()
        .beforeEachResponse((component, { url }) => {
          if (url.includes('.svc/Entities'))
            checkMessage(component, 'Loading 2 Entities…');
        });
    });

    it('initially loads only the first chunk if there are many entities', () => {
      createEntities(3);
      return loadEntityList({
        props: { top: () => 2 }
      })
        .beforeEachResponse((component, config) => {
          if (config.url.includes('.svc/Entities')) {
            checkMessage(component, 'Loading the first 2 of 3 Entities…');
            checkTop(config, 2);
          }
        });
    });

    it('clicking refresh button loads only first chunk of entities', () => {
      createEntities(3);
      return loadEntityList({
        props: { top: () => 2 }
      })
        .complete()
        .request(component =>
          component.get('#entity-list-refresh-button').trigger('click'))
        .beforeEachResponse((_, config) => {
          checkTop(config, 2);
        })
        .respondWithData(() => testData.entityOData(2, 0))
        .afterResponse(component => {
          checkIds(component, 2);
        });
    });

    describe('scrolling', () => {
      it('scrolling to the bottom loads the next chunk of entity', () => {
        createEntities(12);
        // Chunk 1
        return loadEntityList({
          props: { top: (loaded) => (loaded < 8 ? 2 : 3) }
        })
          .beforeEachResponse((component, { url }) => {
            if (url.includes('.svc/Entities'))
              checkMessage(component, 'Loading the first 2 of 12 Entities…');
          })
          .afterResponses(component => {
            checkMessage(component, null);
          })
          // Chunk 2
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 2);
            checkMessage(component, 'Loading 2 more of 10 remaining Entities…');
          })
          .respondWithData(() => testData.entityOData(2, 2))
          .afterResponse(component => {
            checkIds(component, 4);
            checkMessage(component, null);
          })
          // Chunk 3
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 2);
            checkMessage(component, 'Loading 2 more of 8 remaining Entities…');
          })
          .respondWithData(() => testData.entityOData(2, 4))
          .afterResponse(component => {
            checkIds(component, 6);
            checkMessage(component, null);
          })
          // Chunk 4 (last small chunk)
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 2, 6);
            checkMessage(component, 'Loading 2 more of 6 remaining Entities…');
          })
          .respondWithData(() => testData.entityOData(2, 6))
          .afterResponse(component => {
            checkIds(component, 8);
            checkMessage(component, null);
          })
          // Chunk 5
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 3, 8);
            checkMessage(component, 'Loading 3 more of 4 remaining Entities…');
          })
          .respondWithData(() => testData.entityOData(3, 8))
          .afterResponse(component => {
            checkIds(component, 11);
            checkMessage(component, null);
          })
          // Chunk 6
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 3, 11);
            checkMessage(component, 'Loading the last Entity…');
          })
          .respondWithData(() => testData.entityOData(3, 11))
          .afterResponse(component => {
            checkIds(component, 12);
            checkMessage(component, null);
          });
      });

      it('does nothing upon scroll if entity request results in error', () => {
        createEntities(251);
        return load('/projects/1/entity-lists/trees/entities', { root: false }, {
          odataEntities: mockResponse.problem
        })
          .complete()
          .testNoRequest(scroll);
      });

      it('does nothing after user scrolls somewhere other than bottom of page', () => {
        createEntities(5);
        return loadEntityList({
          props: { top: () => 2 }
        })
          .complete()
          .testNoRequest(scroll(false));
      });

      it('clicking refresh button loads first chunk, even after scrolling', () => {
        createEntities(5);
        return loadEntityList({
          props: { top: () => 2 }
        })
          .complete()
          .request(scroll)
          .respondWithData(() => testData.entityOData(2, 2))
          .complete()
          .request(component =>
            component.get('#entity-list-refresh-button').trigger('click'))
          .beforeEachResponse((_, config) => {
            checkTop(config, 2, 0);
          })
          .respondWithData(() => testData.entityOData(2, 0))
          .afterResponse(component => {
            checkIds(component, 2);
          })
          .request(scroll)
          .beforeEachResponse((_, config) => {
            checkTop(config, 2, 2);
          })
          .respondWithData(() => testData.entityOData(2, 2));
      });

      it('scrolling to the bottom has no effect if awaiting response', () => {
        createEntities(5);
        return loadEntityList({
          props: { top: () => 2 }
        })
          .complete()
          // Sends a request.
          .request(scroll)
          // This should not send a request. If it does, then the number of
          // requests will exceed the number of responses, and the mockHttp()
          // object will throw an error.
          .beforeAnyResponse(scroll)
          .respondWithData(() => testData.entityOData(2, 2))
          .complete()
          .request(component =>
            component.get('#entity-list-refresh-button').trigger('click'))
          // Should not send a request.
          .beforeAnyResponse(scroll)
          .respondWithData(() => testData.entityOData(2, 0));
      });

      it('scrolling has no effect after all entities have been loaded', () => {
        createEntities(2);
        return loadEntityList({
          props: { top: () => 2 }
        })
          .complete()
          .testNoRequest(scroll);
      });
    });

    describe('count update', () => {
      it('does not update requestData.odataEntities.originalCount', () => {
        createEntities(251);
        return load('/projects/1/entity-lists/trees/entities', { root: false })
          .afterResponses(component => {
            const { requestData } = component.vm.$container;
            requestData.localResources.odataEntities.originalCount.should.equal(251);
            requestData.dataset.entities.should.equal(251);
          })
          .request(scroll)
          .respondWithData(() => {
            testData.extendedEntities.createPast(1);
            return testData.entityOData(2, 250);
          })
          .afterResponse(component => {
            const { requestData } = component.vm.$container;
            requestData.localResources.odataEntities.originalCount.should.equal(251);
          });
      });
    });
  });
});
