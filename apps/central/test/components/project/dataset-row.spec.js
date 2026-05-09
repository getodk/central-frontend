import ProjectDatasetRow from '../../../src/components/project/dataset-row.vue';
import DatasetLink from '../../../src/components/dataset/link.vue';
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
    mountComponent(true).find('.col-icon span.icon-database').exists().should.be.true;
  });

  it('links to dataset page', () => {
    testData.extendedDatasets.createPast(1, { name: 'people' });
    const component = mountComponent();
    const link = component.get('.dataset-name').getComponent(DatasetLink);
    link.props().should.eql({ projectId: 1, name: 'people' });
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

  it('shows the correct icon for timestamp', () => {
    const lastEntity = '2023-01-01T00:00:00Z';
    testData.extendedDatasets.createPast(1, { name: 'people', lastEntity });
    const cell = mountComponent().get('.last-entity');
    cell.find('.icon-clock-o').exists().should.be.true;
  });

  it('shows (none) if no entity', async () => {
    testData.extendedDatasets.createPast(1, { name: 'people', entities: 0 });
    const span = mountComponent().get('.last-entity span');
    span.text().should.equal('(none)');
    await span.should.have.tooltip('Latest Entity');
  });

  it('last entity has the correct links', () => {
    const lastEntity = '2023-01-01T00:00:00Z';
    testData.extendedDatasets.createPast(1, { name: 'people', lastEntity });
    const link = mountComponent().getComponent('.last-entity a');
    link.props().to.should.equal('/projects/1/entity-lists/people/entities');
  });

  it('shows the correct count for all entities', () => {
    testData.extendedDatasets.createPast(1, { name: 'people', entities: 1234 });
    mountComponent().find('.total-entities').text().should.equal('1,234');
  });

  it('shows the correct icon for entity count', async () => {
    testData.extendedDatasets.createPast(1, { name: 'people', entities: 4 });
    const cell = mountComponent().find('.total-entities');
    cell.find('.icon-asterisk').exists().should.be.true;
    await cell.get('span').should.have.tooltip('Total Entities');
  });

  it('entity count links to the right place', () => {
    testData.extendedDatasets.createPast(1, { name: 'people', entities: 4 });
    const link = mountComponent().getComponent('.total-entities a');
    link.props().to.should.equal('/projects/1/entity-lists/people/entities');
  });

  it('shows the correct conflict count', () => {
    testData.extendedDatasets.createPast(1, { name: 'people', conflicts: 3 });
    const cell = mountComponent().get('.conflicts-count');
    cell.text().should.equal('3 conflicts');
    cell.find('.btn-danger').exists().should.be.true;

    const link = cell.getComponent('a');
    link.props().to.should.equal('/projects/1/entity-lists/people/entities?conflict=true');
  });

  it('should not show warning box when there are 0 conflicts', () => {
    testData.extendedDatasets.createPast(1, { name: 'people', conflicts: 0 });
    const cell = mountComponent().get('.conflicts-count');
    cell.text().should.equal('0');
    cell.find('.btn-danger').exists().should.be.false;
  });
});
