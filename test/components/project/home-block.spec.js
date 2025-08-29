import { RouterLinkStub } from '@vue/test-utils';

import ProjectHomeBlock from '../../../src/components/project/home-block.vue';
import FormRow from '../../../src/components/project/form-row.vue';
import DatasetRow from '../../../src/components/project/dataset-row.vue';

import useProjects from '../../../src/request-data/projects';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => {
  const projectData = { ...testData.extendedProjects.last() };
  projectData.formList = testData.extendedForms.sorted();
  projectData.datasetList = testData.extendedDatasets.sorted();
  const container = createTestContainer({
    requestData: testRequestData([useProjects], { projects: [projectData] }),
    router: mockRouter('/')
  });
  const { projects } = container.requestData.localResources;
  return mount(ProjectHomeBlock, {
    props: {
      project: projects[0],
      // This is a placeholder sort function. The real one will be
      // passed through from project/list.vue
      sortFunc: (a, b) => (a.xmlFormId ? a.xmlFormId.localeCompare(b.xmlFormId) : a.name.localeCompare(b.name))
      // maxForms prop defaults to 3 and that default is used in the following tests.
      // Tests that alter maxForms can be found in project/list.spec.js
    },
    container
  });
};

describe('ProjectHomeBlock', () => {
  beforeEach(mockLogin);

  it('renders the project name correctly', () => {
    testData.extendedProjects.createPast(1, { name: 'My Project' });
    const link = mountComponent().getComponent(RouterLinkStub);
    link.text().should.equal('My Project');
    link.props().to.should.equal('/projects/1');
  });

  it('shows the encrypted label for encrypted forms', () => {
    const key = testData.standardKeys.createPast(1, { managed: true }).last();
    testData.extendedProjects.createPast(1, { key });
    mountComponent().find('.encrypted').exists().should.be.true;
  });

  it('shows empty table when there are zero forms', () => {
    testData.extendedProjects.createPast(1);
    const table = mountComponent().find('.project-form-table');
    table.exists().should.be.false;
  });

  it('shows the correct number of forms if there are only a few', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedForms.createPast(3);
    const block = mountComponent();
    block.findAllComponents(FormRow).length.should.equal(3);
    block.find('.expand-button').exists().should.be.false;
  });

  it('shows the correct number of forms if there are a lot and some should be hidden', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedForms.createPast(4);
    const block = mountComponent();
    block.findAllComponents(FormRow).length.should.equal(3);
    const expand = block.find('.expand-button');
    expand.exists().should.be.true;
    expand.text().should.equal('Show 4 total Forms');
    expand.find('.icon-angle-down').exists().should.be.true;
  });

  it('expands the forms to show more forms', async () => {
    testData.extendedProjects.createPast(1);
    testData.extendedForms.createPast(4);
    const block = mountComponent();
    block.findAllComponents(FormRow).length.should.equal(3);
    const expand = block.find('.expand-button');
    await expand.trigger('click');
    block.findAllComponents(FormRow).length.should.equal(4);
    expand.text().should.equal('Show fewer of 4 total Forms');
    expand.find('.icon-angle-up').exists().should.be.true;
  });

  it('sorts the forms by a given sort function', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedForms.createPast(1, { name: 'Bravo', xmlFormId: 'a' });
    testData.extendedForms.createPast(1, { name: 'Charlie', xmlFormId: 'b' });
    testData.extendedForms.createPast(1, { name: 'Alpha', xmlFormId: 'c' });
    const block = mountComponent();
    const { formList } = block.props().project;
    // formList is sorted by `name`.
    formList.map((form) => form.name).should.eql(['Alpha', 'Bravo', 'Charlie']);
    const rows = block.findAllComponents(FormRow);
    // Test component's sort function defined above will sort by xmlFormId
    rows.map((row) => row.props().form.name).should.eql(['Bravo', 'Charlie', 'Alpha']);
  });

  it('shows correctly sorted forms before and after cutoff forms', async () => {
    testData.extendedProjects.createPast(1);
    testData.extendedForms.createPast(1, { name: 'aaa_z', xmlFormId: 'z' });
    testData.extendedForms.createPast(1, { name: 'bbb_y', xmlFormId: 'y' });
    testData.extendedForms.createPast(1, { name: 'ccc_w', xmlFormId: 'w' });
    testData.extendedForms.createPast(1, { name: 'ddd_x', xmlFormId: 'x' });
    const block = mountComponent();
    let rows = block.findAllComponents(FormRow);
    // Test component's sort function defined above will sort by xmlFormId
    rows.map((row) => row.props().form.name).should.eql(['ccc_w', 'ddd_x', 'bbb_y']);
    const expand = block.find('.expand-button');
    await expand.trigger('click');
    rows = block.findAllComponents(FormRow);
    rows.map((row) => row.props().form.name).should.eql(['ccc_w', 'ddd_x', 'bbb_y', 'aaa_z']);
  });

  it('counts forms correctly in the expander even when filtering out closed forms', async () => {
    testData.extendedProjects.createPast(1);
    testData.extendedForms.createPast(1, { name: 'a', state: 'closing' });
    testData.extendedForms.createPast(1, { name: 'b', state: 'closed' });
    testData.extendedForms.createPast(1, { name: 'c' });
    testData.extendedForms.createPast(1, { name: 'd' });
    testData.extendedForms.createPast(1, { name: 'e' });
    const block = mountComponent();
    const expand = block.find('.expand-button');
    expand.exists().should.be.true;
    expand.text().should.equal('Show 4 total Forms');
    await expand.trigger('click');
    const rows = block.findAllComponents(FormRow);
    rows.map((row) => row.props().form.name).should.eql(['a', 'c', 'd', 'e']);
  });

  it('shows the correct number of forms and datasets if there are only a few', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedForms.createPast(3);
    testData.extendedDatasets.createPast(3);
    const block = mountComponent();
    block.findAllComponents(FormRow).length.should.equal(3);
    block.findAllComponents(DatasetRow).length.should.equal(3);
    block.find('.expand-button').exists().should.be.false;
    block.find('.margin').exists().should.be.true;
  });

  it('shows the correct number of datasets if there are a lot and some should be hidden', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedDatasets.createPast(4);
    const block = mountComponent();
    block.findAllComponents(DatasetRow).length.should.equal(3);
    block.find('.project-form-row .expand-button').exists().should.be.false;
    const expand = block.find('.project-dataset-row .expand-button');
    expand.exists().should.be.true;
    expand.text().should.equal('Show 4 total Entity Lists');
    expand.find('.icon-angle-down').exists().should.be.true;
    block.find('.margin').exists().should.be.false;
  });

  it('expands the datasets to show more datasets', async () => {
    testData.extendedProjects.createPast(1);
    testData.extendedDatasets.createPast(4);
    const block = mountComponent();
    block.findAllComponents(DatasetRow).length.should.equal(3);
    const expand = block.find('.project-dataset-row .expand-button');
    await expand.trigger('click');
    block.findAllComponents(DatasetRow).length.should.equal(4);
    expand.text().should.equal('Show fewer of 4 total Entity Lists');
    expand.find('.icon-angle-up').exists().should.be.true;
  });

  it('sorts the datasets by a given sort function', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedDatasets.createPast(1, { name: 'Bravo' });
    testData.extendedDatasets.createPast(1, { name: 'Charlie' });
    testData.extendedDatasets.createPast(1, { name: 'Alpha' });
    const block = mountComponent();
    const { datasetList } = block.props().project;
    datasetList.map((dataset) => dataset.name).should.eql(['Alpha', 'Bravo', 'Charlie']);
    const rows = block.findAllComponents(DatasetRow);
    rows.map((row) => row.props().dataset.name).should.eql(['Alpha', 'Bravo', 'Charlie']);
  });

  it('shows the correct number of forms and datasets if there are a lot and some should be hidden', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedForms.createPast(5);
    testData.extendedDatasets.createPast(4);

    const block = mountComponent();

    block.findAllComponents(DatasetRow).length.should.equal(3);
    const formExpand = block.find('.project-form-row .expand-button');
    formExpand.exists().should.be.true;
    formExpand.text().should.equal('Show 5 total Forms');
    formExpand.find('.icon-angle-down').exists().should.be.true;

    block.findAllComponents(FormRow).length.should.equal(3);
    const dsExpand = block.find('.project-dataset-row .expand-button');
    dsExpand.exists().should.be.true;
    dsExpand.text().should.equal('Show 4 total Entity Lists');
    dsExpand.find('.icon-angle-down').exists().should.be.true;
  });

  it('sums conflicts for hidden datasets', async () => {
    testData.extendedProjects.createPast(1);
    testData.extendedDatasets.createPast(6, { conflicts: 2 });
    const block = mountComponent();
    const expandingRow = block.findAll('.project-dataset-row')[3];

    // there is a caption text 'hidden'
    expandingRow.find('.conflict-caption').text().should.equal('hidden');

    // conflicts are summed up for the hidden rows
    const hiddenConflictCell = expandingRow.find('.conflicts-count a');
    hiddenConflictCell.text().should.equal('6 conflicts');

    // conflict badge expands the rows
    await hiddenConflictCell.trigger('click');
    const expand = expandingRow.find('.expand-button');
    expand.text().should.equal('Show fewer of 6 total Entity Lists');
  });

  it('sums conflicts for hidden datasets with sort function', async () => {
    testData.extendedProjects.createPast(1);
    testData.extendedDatasets.createPast(1, { conflicts: 2, name: 'Alpha', lastEntity: '2023-01-01' });
    testData.extendedDatasets.createPast(1, { conflicts: 3, name: 'Bravo', lastEntity: '2020-01-01' });
    testData.extendedDatasets.createPast(1, { conflicts: 2, name: 'Charlie', lastEntity: '2020-01-01' });
    testData.extendedDatasets.createPast(1, { conflicts: 5, name: 'Delta', lastEntity: '2023-01-01' });
    testData.extendedDatasets.createPast(1, { conflicts: 3, name: 'Echo', lastEntity: '2023-01-01' });
    const block = mountComponent();
    const expandingRow = block.findAll('.project-dataset-row')[3];

    // conflicts are summed up for the hidden rows
    const hiddenConflictCell = expandingRow.find('.conflicts-count a');
    hiddenConflictCell.text().should.equal('8 conflicts'); // sum of Delta & Echo

    await block.setProps({ sortFunc: (a, b) => b.lastEntity.localeCompare(a.lastEntity) });
    hiddenConflictCell.text().should.equal('5 conflicts'); // sum of Bravo & Charlie
  });

  it('shows nothing when there is no conflict', async () => {
    testData.extendedProjects.createPast(1);
    testData.extendedDatasets.createPast(4);
    const block = mountComponent();
    block.findAllComponents(DatasetRow).length.should.equal(3);

    // nothing is show in conflict column when there's no conflict
    const expandingRow = block.findAll('.project-dataset-row')[3];
    expandingRow.find('.conflicts-count').exists().should.be.false;
    expandingRow.find('.conflict-caption').exists().should.be.false;
  });
});
