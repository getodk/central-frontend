import DlData from '../../../src/components/dl-data.vue';
import EntityData from '../../../src/components/entity/data.vue';
import EntityUpdate from '../../../src/components/entity/update.vue';

import useEntity from '../../../src/request-data/entity';

import testData from '../../data';
import { load } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) =>
  mount(EntityData, mergeMountOptions(options, {
    container: {
      requestData: testRequestData([useEntity], {
        project: testData.extendedProjects.last(),
        dataset: testData.extendedDatasets.last(),
        entity: testData.extendedEntities.last()
      })
    }
  }));

describe('EntityData', () => {
  describe('edit button', () => {
    it('renders the button for a sitewide administrator', () => {
      mockLogin();
      testData.extendedEntities.createPast(1);
      const button = mountComponent().find('#entity-data-update-button');
      button.exists().should.be.true;
    });

    it('does not render the button for a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', datasets: 1 });
      testData.extendedEntities.createPast(1);
      const button = mountComponent().find('#entity-data-update-button');
      button.exists().should.be.false;
    });

    it('toggles the modal', () => {
      mockLogin();
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      return load('/projects/1/entity-lists/trees/entities/e', { root: false })
        .testModalToggles({
          modal: EntityUpdate,
          show: '#entity-data-update-button',
          hide: ['.btn-link']
        });
    });
  });

  it('renders an item for each property', () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '1', circumference: '2' }
    });
    const data = mountComponent().findAllComponents(DlData);
    data.map(wrapper => wrapper.props()).should.eql([
      { name: 'height', value: '1' },
      { name: 'circumference', value: '2' }
    ]);
  });
});
