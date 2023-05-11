import EntityActivity from '../../../src/components/entity/activity.vue';
import EntityUpdate from '../../../src/components/entity/update.vue';

import useEntity from '../../../src/request-data/entity';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => mount(EntityActivity, {
  container: {
    requestData: testRequestData([useEntity], {
      project: testData.extendedProjects.last(),
      dataset: testData.extendedDatasets.last(),
      audits: testData.extendedAudits.sorted(),
      diffs: []
    }),
    router: mockRouter('/projects/1/datasets/trees/entities/e')
  }
});

describe('EntityActivity', () => {
  describe('edit button', () => {
    it('renders the button for a sitewide administrator', () => {
      mockLogin();
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      const button = mountComponent().find('#entity-activity-update-button');
      button.exists().should.be.true();
    });

    it('does not render the button for a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', datasets: 1 });
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      const button = mountComponent().find('#entity-activity-update-button');
      button.exists().should.be.false();
    });

    it('toggles the modal', () => {
      mockLogin();
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      return load('/projects/1/datasets/trees/entities/e', { root: false })
        .testModalToggles({
          modal: EntityUpdate,
          show: '#entity-activity-update-button',
          hide: ['.btn-link']
        });
    });

    describe('after a successful response', () => {
      const submit = () => {
        mockLogin();
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
        return load('/projects/1/datasets/%C3%A1/entities/e', { root: false })
          .complete()
          .request(async (component) => {
            await component.get('#entity-activity-update-button').trigger('click');
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
});
