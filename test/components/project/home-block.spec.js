import { RouterLinkStub } from '@vue/test-utils';

import ProjectHomeBlock from '../../../src/components/project/home-block.vue';
import FormRow from '../../../src/components/project/form-row.vue';

import Form from '../../../src/presenters/form';
import Project from '../../../src/presenters/project';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(ProjectHomeBlock, {
  props: {
    project: new Project(testData.extendedProjects.last()),
    // This is a placeholder sort function. The real one will be
    // passed through from project/list.vue
    sortFunc: (a, b) => a.xmlFormId.localeCompare(b.xmlFormId)
  },
  container: { router: mockRouter('/') }
});

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
    mountComponent().find('.encrypted').exists().should.be.true();
  });

  it('shows empty table when there are zero forms', () => {
    testData.extendedProjects.createPast(1);
    const table = mountComponent().find('.project-form-table');
    table.exists().should.be.false();
  });

  it('shows the correct number of forms if there are only a few', () => {
    const project = testData.extendedProjects.createPast(1).last();
    testData.extendedForms.createPast(3);
    project.formList.push(...testData.extendedForms.sorted().map((form) => new Form(form)));
    const block = mountComponent();
    block.findAllComponents(FormRow).length.should.equal(3);
    block.find('.expand-button').exists().should.be.false();
  });

  it('shows the correct number of forms if there are a lot and some should be hidden', () => {
    const project = testData.extendedProjects.createPast(1).last();
    testData.extendedForms.createPast(4);
    project.formList.push(...testData.extendedForms.sorted().map((form) => new Form(form)));
    const block = mountComponent();
    block.findAllComponents(FormRow).length.should.equal(3);
    const expand = block.find('.expand-button');
    expand.exists().should.be.true();
    expand.text().should.equal('Show 4 total');
    expand.find('.icon-angle-down').exists().should.be.true();
  });

  it('expands the forms to show more forms', async () => {
    const project = testData.extendedProjects.createPast(1).last();
    testData.extendedForms.createPast(4);
    project.formList.push(...testData.extendedForms.sorted().map((form) => new Form(form)));
    const block = mountComponent();
    block.findAllComponents(FormRow).length.should.equal(3);
    const expand = block.find('.expand-button');
    await expand.trigger('click');
    block.findAllComponents(FormRow).length.should.equal(4);
    expand.text().should.equal('Show fewer of 4 total');
    expand.find('.icon-angle-up').exists().should.be.true();
  });

  it('sorts the forms by a given sort function', () => {
    const project = testData.extendedProjects.createPast(1).last();
    testData.extendedForms.createPast(1, { name: 'Bravo', xmlFormId: 'a' });
    testData.extendedForms.createPast(1, { name: 'Charlie', xmlFormId: 'b' });
    testData.extendedForms.createPast(1, { name: 'Alpha', xmlFormId: 'c' });
    // extendedForms.sorted() (to get a full list of forms) sorts by name
    project.formList.push(...testData.extendedForms.sorted().map((form) => new Form(form)));
    project.formList.map((form) => form.name).should.eql(['Alpha', 'Bravo', 'Charlie']);
    const rows = mountComponent().findAllComponents(FormRow);
    // Test component's sort function defined above will sort by xmlFormId
    rows.map((row) => row.props().form.name).should.eql(['Bravo', 'Charlie', 'Alpha']);
  });

  it('shows correctly sorted forms before and after cutoff forms', async () => {
    const project = testData.extendedProjects.createPast(1).last();
    testData.extendedForms.createPast(1, { name: 'aaa_z', xmlFormId: 'z' });
    testData.extendedForms.createPast(1, { name: 'bbb_y', xmlFormId: 'y' });
    testData.extendedForms.createPast(1, { name: 'ccc_w', xmlFormId: 'w' });
    testData.extendedForms.createPast(1, { name: 'ddd_x', xmlFormId: 'x' });
    project.formList.push(...testData.extendedForms.sorted().map((form) => new Form(form)));
    const block = mountComponent();
    let rows = block.findAllComponents(FormRow);
    // Test component's sort function defined above will sort by xmlFormId
    rows.map((row) => row.props().form.name).should.eql(['ccc_w', 'ddd_x', 'bbb_y']);
    const expand = block.find('.expand-button');
    await expand.trigger('click');
    rows = block.findAllComponents(FormRow);
    rows.map((row) => row.props().form.name).should.eql(['ccc_w', 'ddd_x', 'bbb_y', 'aaa_z']);
  });
});
