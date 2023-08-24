import EntityUpdate from '../../../src/components/entity/update.vue';
import NotFound from '../../../src/components/not-found.vue';
import PageBack from '../../../src/components/page/back.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('EntityShow', () => {
  beforeEach(mockLogin);

  it('requires the projectId route param to be integer', async () => {
    const component = await load('/projects/p/entity-lists/trees/entities/e', {
      root: false
    });
    component.findComponent(NotFound).exists().should.be.true();
  });

  it('validates the uuid route param', async () => {
    const component = await load('/projects/1/entity-lists/trees/entities/e f', {
      root: false
    });
    component.findComponent(NotFound).exists().should.be.true();
  });

  it('sends the correct initial requests', () => {
    testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
    testData.extendedEntities.createPast(1, { uuid: 'e' });
    return load('/projects/1/entity-lists/%C3%A1/entities/e', { root: false })
      .testRequests([
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e', extended: true },
        { url: '/v1/projects/1', extended: true },
        { url: '/v1/projects/1/datasets/%C3%A1', extended: true },
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e/audits' },
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e/diffs' }
      ]);
  });

  it('renders a back link', async () => {
    testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
    testData.extendedEntities.createPast(1, { uuid: 'e' });
    const component = await load('/projects/1/entity-lists/%C3%A1/entities/e', {
      root: false
    });
    const back = component.getComponent(PageBack);
    back.props().to.should.equal('/projects/1/entity-lists/%C3%A1/entities');
    back.get('#page-back-back').text().should.equal('Back to á Table');
  });

  it('shows the entity label', async () => {
    testData.extendedEntities.createPast(1, { uuid: 'e', label: 'My Entity' });
    const component = await load('/projects/1/entity-lists/trees/entities/e', {
      root: false
    });
    component.get('#page-head-title').text().should.equal('My Entity');
  });

  describe('after a successful update', () => {
    const submit = () => {
      testData.extendedDatasets.createPast(1, {
        name: 'á',
        properties: [{ name: 'height' }],
        entities: 1
      });
      testData.extendedEntities.createPast(1, {
        uuid: 'e',
        label: 'My Entity',
        data: { height: '1' }
      });
      return load('/projects/1/entity-lists/%C3%A1/entities/e', { root: false })
        .complete()
        .request(async (component) => {
          await component.get('#entity-data-update-button').trigger('click');
          const form = component.get('#entity-update form');
          const textareas = form.findAll('textarea');
          textareas.length.should.equal(2);
          await textareas[0].setValue('Updated Entity');
          await textareas[1].setValue('2');
          return form.trigger('submit');
        })
        .respondWithData(() => {
          const { currentVersion } = testData.extendedEntities.last();
          testData.extendedEntities.update(-1, {
            currentVersion: {
              ...currentVersion,
              label: 'Updated Entity',
              data: { height: '2' }
            }
          });
          testData.extendedAudits.createPast(1, {
            action: 'entity.update.version'
          });
          return testData.standardEntities.last();
        })
        .respondWithData(() => testData.extendedAudits.sorted())
        .respondWithData(() => []);
    };

    it('sends the correct requests for activity data', () =>
      submit().testRequests([
        null,
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e/audits' },
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e/diffs' }
      ]));

    it('hides the modal', async () => {
      const component = await submit();
      component.getComponent(EntityUpdate).props().state.should.be.false();
    });

    it('shows a success alert', async () => {
      const component = await submit();
      component.should.alert('success');
    });

    it('updates the label', async () => {
      const component = await submit();
      component.get('#page-head-title').text().should.equal('Updated Entity');
    });

    it('updates the entity data', async () => {
      const component = await submit();
      component.get('#entity-data dd').text().should.equal('2');
    });

    it('updates the number of entries in the feed');
  });
});
