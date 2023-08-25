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
      button.exists().should.be.true();
    });

    it('does not render the button for a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', datasets: 1 });
      testData.extendedEntities.createPast(1);
      const button = mountComponent().find('#entity-data-update-button');
      button.exists().should.be.false();
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
    mountComponent().findAll('dl > div').length.should.equal(2);
  });

  it('shows the property name', async () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '1' }
    });
    const span = mountComponent().get('dt span');
    span.text().should.equal('height');
    await span.should.have.textTooltip();
  });

  it('shows the property value', () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '1' }
    });
    mountComponent().get('dd').text().should.equal('1');
  });

  describe('tooltip for the property value', () => {
    it('shows a tooltip if the value does not fit within 3 lines', async () => {
      testData.extendedEntities.createPast(1, {
        data: { notes: 'The\ntree\nis\ntall.' }
      });
      const dd = mountComponent({ attachTo: document.body }).get('dd');
      await dd.should.have.tooltip('The\ntree\nis\ntall.');
    });

    it('does not show a tooltip if the value fits within 3 lines', async () => {
      testData.extendedEntities.createPast(1, {
        data: { notes: 'Tall' }
      });
      const dd = mountComponent({ attachTo: document.body }).get('dd');
      await dd.should.not.have.tooltip();
    });
  });

  it('renders correctly if the value of a property is an empty string', () => {
    testData.extendedEntities.createPast(1, {
      data: { height: '' }
    });
    const dd = mountComponent().get('dd');
    dd.text().should.equal('(empty)');
    dd.classes('empty').should.be.true();
  });

  it('renders correctly if the value of a property does not exist', () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'height' }],
      entities: 1
    });
    testData.extendedEntities.createPast(1, { data: {} });
    const dd = mountComponent().get('dd');
    dd.text().should.equal('(empty)');
    dd.classes('empty').should.be.true();
  });
});
