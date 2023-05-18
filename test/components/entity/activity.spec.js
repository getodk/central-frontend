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
  });
});
