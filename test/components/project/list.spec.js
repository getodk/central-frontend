import ProjectList from '../../../src/components/project/list.vue';
import ProjectHomeBlock from '../../../src/components/project/home-block.vue';
import FormRow from '../../../src/components/project/form-row.vue';

import { ago } from '../../../src/util/date-time';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(ProjectList, {
  container: {
    router: mockRouter('/'),
    requestData: { projects: testData.extendedProjects.sorted() }
  }
});

const createProjectsWithForms = (projects, forms) => {
  // Input: Two arrays of same length with options for creating
  // projects and corresponding form lists
  // [{ proj }, { proj }]
  // [[{ form }, { form }, { form }], [{ form }, { form }]]
  for (const [i, projectOptions] of projects.entries()) {
    const project = testData.extendedProjects.createPast(1, projectOptions).last();
    for (const formOptions of forms[i]) {
      const form = testData.extendedForms.createPast(1, { project, reviewStates: {}, ...formOptions }).last();
      project.formList.push(form);
    }
  }
};

describe('ProjectList', () => {
  beforeEach(mockLogin);

  it('shows a message if there are no projects', () => {
    // TODO: show something fancier when there are no projects and update test
    mountComponent().get('.empty-table-message').should.be.visible();
  });

  it('renders a row for each project', () => {
    testData.extendedProjects.createPast(2);
    mountComponent().findAllComponents(ProjectHomeBlock).length.should.equal(2);
  });

  it('renders a row for each project', () => {
    createProjectsWithForms(
      [{ name: 'Alpha Project' }, { name: 'Bravo Project' }],
      [[{}, {}], [{}, {}, {}, {}, {}]]
    );
    const list = mountComponent();
    list.findAllComponents(ProjectHomeBlock).length.should.equal(2);
    list.findAllComponents(FormRow).length.should.equal(5);
  });

  it('shows archived projects at the bottom of the page', () => {
    testData.extendedProjects.createPast(2);
    testData.extendedProjects.createPast(3, { archived: true });
    mountComponent().findAll('#archived-projects .project-title').length.should.equal(3);
  });

  it('does not show archived header if no archived projects exist', () => {
    mountComponent().find('#archived-projects').exists().should.be.false();
  });

  describe('sorting', () => {
    beforeEach(() => {
      createProjectsWithForms(
        [
          { name: 'A', lastSubmission: ago({ days: 15 }).toISO(), createdAt: ago({ days: 30 }).toISO() },
          { name: 'B', lastSubmission: ago({ days: 5 }).toISO(), createdAt: ago({ days: 40 }).toISO() },
          { name: 'C', lastSubmission: ago({ days: 10 }).toISO(), createdAt: ago({ days: 20 }).toISO() },
          { name: 'D', lastSubmission: ago({ days: 10 }).toISO(), archived: true },
          { name: 'E', lastSubmission: ago({ days: 5 }).toISO(), archived: true }
        ],
        [
          [{ lastSubmission: ago({ days: 15 }).toISO() }],
          [
            { name: 'X', lastSubmission: ago({ days: 20 }).toISO(), createdAt: ago({ days: 37 }).toISO() },
            { name: 'Y', lastSubmission: ago({ days: 10 }).toISO(), createdAt: ago({ days: 39 }).toISO() },
            { name: 'Z', lastSubmission: ago({ days: 5 }).toISO(), createdAt: ago({ days: 38 }).toISO() }
          ],
          [{ lastSubmission: ago({ days: 10 }).toISO() }],
          [{}],
          []
        ]
      );
    });

    it('sorts by latest submission by default', () => {
      const blocks = mountComponent().findAllComponents(ProjectHomeBlock);
      blocks.length.should.equal(3);
      blocks.map((block) => block.props().project.name).should.eql(['B', 'C', 'A']);
      const formRows = blocks[0].findAllComponents(FormRow);
      formRows.map((row) => row.props().form.name).should.eql(['Z', 'Y', 'X']);
    });

    it('changes sort to alphabetical', async () => {
      const component = mountComponent();
      await component.find('#project-sort select').setValue('alphabetical');
      const blocks = component.findAllComponents(ProjectHomeBlock);
      blocks.length.should.equal(3);
      blocks.map((block) => block.props().project.name).should.eql(['A', 'B', 'C']);
      const formRows = blocks[1].findAllComponents(FormRow);
      formRows.map((row) => row.props().form.name).should.eql(['X', 'Y', 'Z']);
    });

    it.skip('changes sort to newest', async () => {
      // TODO don't know how to control createdAt date on projects and forms
      const component = mountComponent();
      await component.find('#project-sort select').setValue('newest');
      const blocks = component.findAllComponents(ProjectHomeBlock);
      blocks.length.should.equal(3);
      blocks.map((block) => block.props().project.name).should.eql(['C', 'A', 'B']);
      const formRows = blocks[2].findAllComponents(FormRow);
      formRows.map((row) => row.props().form.name).should.eql(['X', 'Z', 'Y']);
    });

    it('sorts archived projects by latest submission by default', () => {
      const archived = mountComponent().findAll('#archived-projects .project-title');
      archived.map((projDiv) => projDiv.text()).should.eql(['E', 'D']);
    });

    it('changes sort of archived projects', async () => {
      const component = mountComponent();
      await component.find('#project-sort select').setValue('alphabetical');
      const archived = component.findAll('#archived-projects .project-title');
      archived.map((projDiv) => projDiv.text()).should.eql(['D', 'E']);
    });

    // TODO: tests that sort projects and forms with empty last submissions in the right way
  });

  it('shows the appropriate number of forms based on total project/form numbers', () => {
    // TODO (not implemented yet)
  });
});

