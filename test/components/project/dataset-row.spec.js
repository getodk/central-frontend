import ProjectDatasetRow from '../../../src/components/project/dataset-row.vue';
import DateTime from '../../../src/components/date-time.vue';

import useProjects from '../../../src/request-data/projects';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { setLuxon } from '../../util/date-time';
import { testRequestData } from '../../util/request-data';

const mountComponent = (showIcon = false) => {
  const projectData = { ...testData.extendedProjects.last() };
  projectData.datasetList = testData.extendedDatasets.sorted();
  const container = createTestContainer({
    requestData: testRequestData([useProjects], { projects: [projectData] }),
    router: mockRouter('/')
  });
  const project = container.requestData.localResources.projects[0];
  return mount(ProjectDatasetRow, {
    props: { dataset: project.datasetList[0], project, showIcon },
    container
  });
};

describe('ProjectDatasetRow', () => {
  beforeEach(mockLogin);

  it('renders the dataset name correctly', () => {
    testData.extendedDatasets.createPast(1, { name: 'people' });
    const link = mountComponent().find('.dataset-name a');
    link.text().should.equal('people');
  });

  it('should show dataset icon', () => {
    testData.extendedDatasets.createPast(1, { name: 'people' });
    mountComponent(true).find('.col-icon span.icon-database').exists().should.be.true();
  });

  it('links to dataset page', () => {
    testData.extendedDatasets.createPast(1, { name: 'people' });
    const link = mountComponent().getComponent('.dataset-name a');
    link.props().to.should.equal('/projects/1/entity-lists/people');
  });

  it('shows the correct time since the last entity', async () => {
    setLuxon({ defaultZoneName: 'UTC' });
    const lastEntity = '2023-01-01T00:00:00Z';
    testData.extendedDatasets.createPast(1, { name: 'people', lastEntity });
    const span = mountComponent().get('.last-entity span');
    span.text().should.match(/ago$/);
    const dateTime = span.getComponent(DateTime);
    dateTime.props().iso.should.equal(lastEntity);
    await span.should.have.tooltip('Latest Entity\n2023/01/01 00:00:00');
    await dateTime.should.not.have.tooltip();
  });

  it('shows the correct icon', () => {
    setLuxon({ defaultZoneName: 'UTC' });
    const lastEntity = '2023-01-01T00:00:00Z';
    testData.extendedDatasets.createPast(1, { name: 'people', lastEntity, entities: 0 });
    const cell = mountComponent().get('.last-entity');
    cell.find('.icon-clock-o').exists().should.be.true();
  });

  it('shows (none) if no entity', async () => {
    testData.extendedDatasets.createPast(1, { name: 'people', entities: 0 });
    const span = mountComponent().get('.last-entity span');
    span.text().should.equal('(none)');
    await span.should.have.tooltip('Latest Entity');
  });

  it('last entity has the correct links', () => {
    setLuxon({ defaultZoneName: 'UTC' });
    const lastEntity = '2023-01-01T00:00:00Z';
    testData.extendedDatasets.createPast(1, { name: 'people', lastEntity, entities: 0 });
    const link = mountComponent().getComponent('.last-entity a');
    link.props().to.should.equal('/projects/1/entity-lists/people/entities');
  });

  it('shows the correct count for all entities', () => {
    testData.extendedDatasets.createPast(1, { name: 'people', entities: 1234 });
    mountComponent().find('.total-entities').text().should.equal('1,234');
  });

  it('shows the correct icon', async () => {
    testData.extendedDatasets.createPast(1, { name: 'people', entities: 4 });
    const cell = mountComponent().find('.total-entities');
    cell.find('.icon-asterisk').exists().should.be.true();
    await cell.get('span').should.have.tooltip('Total Entities');
  });

  it('entity count links to the right place', () => {
    testData.extendedDatasets.createPast(1, { name: 'people', entities: 4 });
    const link = mountComponent().getComponent('.total-entities a');
    link.props().to.should.equal('/projects/1/entity-lists/people/entities');
  });
});
