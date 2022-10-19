import ProjectList from '../../../src/components/project/list.vue';
import ProjectHomeBlock from '../../../src/components/project/home-block.vue';
import FormRow from '../../../src/components/project/form-row.vue';

import useProjects from '../../../src/request-data/projects';
import { ago } from '../../../src/util/date-time';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => mount(ProjectList, {
  container: {
    requestData: testRequestData([useProjects], {
      projects: testData.extendedProjects.sorted()
    }),
    router: mockRouter('/')
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
      const form = testData.extendedForms.createPast(1, { project, ...formOptions }).last();
      project.formList.push(form);
    }
  }
};

describe('ProjectList', () => {
  describe('no projects', () => {
    it('shows the correct message if the user can project.create', () => {
      mockLogin();
      const message = mountComponent().get('.empty-table-message');
      message.should.be.visible();
      message.text().should.startWith('To get started, create a Project.');
    });

    it('shows the correct message if the user cannot project.create', () => {
      mockLogin({ role: 'none' });
      const message = mountComponent().get('.empty-table-message');
      message.should.be.visible();
      message.text().should.startWith('There are no Projects to show.');
    });

    it('shows the message if there are only archived projects', () => {
      mockLogin();
      testData.extendedProjects.createPast(1, { archived: true });
      mountComponent().get('.empty-table-message').should.be.visible();
    });
  });

  it('renders a row for each project', () => {
    mockLogin();
    createProjectsWithForms(
      [{ name: 'Alpha Project' }, { name: 'Bravo Project' }],
      [[{}, {}], [{}, {}, {}, {}, {}]]
    );
    const list = mountComponent();
    list.findAllComponents(ProjectHomeBlock).length.should.equal(2);
    list.findAllComponents(FormRow).length.should.equal(7);
  });

  it('shows archived projects at the bottom of the page', () => {
    mockLogin();
    testData.extendedProjects.createPast(2);
    testData.extendedProjects.createPast(3, { archived: true });
    mountComponent().findAll('#project-list-archived .project-title').length.should.equal(3);
  });

  it('does not show archived header if no archived projects exist', () => {
    mockLogin();
    mountComponent().find('#project-list-archived').exists().should.be.false();
  });

  describe('sorting', () => {
    beforeEach(() => {
      mockLogin();
      createProjectsWithForms(
        [
          { name: 'A', lastSubmission: ago({ days: 15 }).toISO() },
          { name: 'B', lastSubmission: ago({ days: 5 }).toISO() },
          { name: 'C', lastSubmission: ago({ days: 10 }).toISO() },
          { name: 'D', lastSubmission: ago({ days: 10 }).toISO(), archived: true },
          { name: 'E', lastSubmission: ago({ days: 5 }).toISO(), archived: true }
        ],
        [
          [{ lastSubmission: ago({ days: 15 }).toISO() }],
          [
            { name: 'X', lastSubmission: ago({ days: 20 }).toISO() },
            { name: 'Y', lastSubmission: ago({ days: 10 }).toISO() },
            { name: 'Z', lastSubmission: ago({ days: 5 }).toISO() }
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

    it('changes sort to newest', async () => {
      // createdAt fields will be in order of test data creation
      const component = mountComponent();
      await component.find('#project-sort select').setValue('newest');
      const blocks = component.findAllComponents(ProjectHomeBlock);
      blocks.length.should.equal(3);
      blocks.map((block) => block.props().project.name).should.eql(['C', 'B', 'A']);
      const formRows = blocks[1].findAllComponents(FormRow);
      formRows.map((row) => row.props().form.name).should.eql(['Z', 'Y', 'X']);
    });

    it('sorts archived projects by latest submission by default', () => {
      const archived = mountComponent().findAll('#project-list-archived .project-title');
      archived.map((projDiv) => projDiv.text()).should.eql(['E', 'D']);
    });

    it('changes sort of archived projects', async () => {
      const component = mountComponent();
      await component.find('#project-sort select').setValue('alphabetical');
      const archived = component.findAll('#project-list-archived .project-title');
      archived.map((projDiv) => projDiv.text()).should.eql(['D', 'E']);
    });
  });

  describe('sorting with ties', () => {
    beforeEach(mockLogin);

    it('sorts projects alphabetically when last submission is null', async () => {
      createProjectsWithForms(
        [
          { name: 'C_no_subs' },
          { name: 'B_no_subs' },
          { name: 'X_subs', lastSubmission: ago({ days: 15 }).toISO() },
          { name: 'A_no_subs' }
        ],
        [
          [],
          [],
          [
            { name: 'C' },
            { name: 'X', lastSubmission: ago({ days: 10 }).toISO() },
            { name: 'Y', lastSubmission: ago({ days: 5 }).toISO() },
            { name: 'B' },
            { name: 'A' }
          ],
          []
        ]
      );

      const component = mountComponent();
      const blocks = component.findAllComponents(ProjectHomeBlock);
      await component.find('#project-sort select').setValue('latest');
      blocks.length.should.equal(4);
      blocks.map((block) => block.props().project.name).should.eql(['X_subs', 'A_no_subs', 'B_no_subs', 'C_no_subs']);
      const formRows = blocks[0].findAllComponents(FormRow);
      formRows.map((row) => row.props().form.name).should.eql(['Y', 'X', 'A', 'B', 'C']);
    });
  });

  describe('dynamic numbers of forms', () => {
    beforeEach(mockLogin);

    it('renders correctly when there is one project with many forms', () => {
      createProjectsWithForms(
        [{ name: 'Project 1' }, { name: 'Project 2' }],
        [
          [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
          [{}]
        ]
      );
      const component = mountComponent();
      component.findAllComponents(FormRow).length.should.equal(15);
      const blocks = component.findAllComponents(ProjectHomeBlock);
      blocks[0].props().maxForms.should.equal(14);
      blocks[0].findAllComponents(FormRow).length.should.equal(14);
      blocks[1].findAllComponents(FormRow).length.should.equal(1);
    });

    it('renders correctly when exactly 15 forms evenly distributed between projects', () => {
      createProjectsWithForms(
        [{ name: 'Project 1' }, { name: 'Project 2' }, { name: 'Project 3' }],
        [
          [{}, {}, {}, {}, {}],
          [{}, {}, {}, {}, {}],
          [{}, {}, {}, {}, {}]
        ]
      );
      const component = mountComponent();
      component.findAllComponents(FormRow).length.should.equal(15);
      const blocks = component.findAllComponents(ProjectHomeBlock);
      blocks[0].props().maxForms.should.equal(5);
      blocks[0].findAllComponents(FormRow).length.should.equal(5);
      blocks[1].findAllComponents(FormRow).length.should.equal(5);
      blocks[2].findAllComponents(FormRow).length.should.equal(5);
    });

    it('renders 15 of 16 almost-evenly distributed forms', () => {
      createProjectsWithForms(
        [{ name: 'Project 1' }, { name: 'Project 2' }, { name: 'Project 3' }],
        [
          [{}, {}, {}, {}, {}],
          [{}, {}, {}, {}, {}, {}],
          [{}, {}, {}, {}, {}]
        ]
      );
      const component = mountComponent();
      component.findAllComponents(FormRow).length.should.equal(15);
      const blocks = component.findAllComponents(ProjectHomeBlock);
      blocks[0].props().maxForms.should.equal(5);
      blocks[0].findAllComponents(FormRow).length.should.equal(5);
      blocks[1].findAllComponents(FormRow).length.should.equal(5);
      blocks[2].findAllComponents(FormRow).length.should.equal(5);
    });

    it('uses the same form limit across home blocks', () => {
      createProjectsWithForms(
        [
          { name: 'Project 1' },
          { name: 'Project 2' },
          { name: 'Project 3' },
          { name: 'Project 4' }
        ],
        [
          [{}, {}, {}, {}],
          [{}, {}, {}, {}],
          [{}, {}, {}, {}],
          [{}, {}, {}, {}]
        ]
      );
      const component = mountComponent();
      component.findAllComponents(FormRow).length.should.equal(12);
      const blocks = component.findAllComponents(ProjectHomeBlock);
      blocks[0].props().maxForms.should.equal(3);
      blocks[0].findAllComponents(FormRow).length.should.equal(3);
      blocks[1].findAllComponents(FormRow).length.should.equal(3);
      blocks[2].findAllComponents(FormRow).length.should.equal(3);
      blocks[3].findAllComponents(FormRow).length.should.equal(3);
    });

    it('renders correctly with a small number of forms where one project is above the original limit', () => {
      createProjectsWithForms(
        [
          { name: 'Project 1' },
          { name: 'Project 2' }
        ],
        [
          [{}, {}, {}, {}],
          [{}, {}]
        ]
      );
      const component = mountComponent();
      component.findAllComponents(FormRow).length.should.equal(6);
      const blocks = component.findAllComponents(ProjectHomeBlock);
      blocks[0].props().maxForms.should.equal(4);
      blocks[0].findAllComponents(FormRow).length.should.equal(4);
      blocks[1].findAllComponents(FormRow).length.should.equal(2);
    });

    it('it renders correctly with a small number of forms', () => {
      createProjectsWithForms(
        [
          { name: 'Project 1' },
          { name: 'Project 2' }
        ],
        [
          [{}, {}, {}],
          [{}, {}]
        ]
      );
      const component = mountComponent();
      component.findAllComponents(FormRow).length.should.equal(5);
      const blocks = component.findAllComponents(ProjectHomeBlock);
      blocks[0].props().maxForms.should.equal(4);
      blocks[0].findAllComponents(FormRow).length.should.equal(3);
      blocks[1].findAllComponents(FormRow).length.should.equal(2);
    });

    it('takes into account closed forms', () => {
      createProjectsWithForms(
        [
          { name: 'Project 1' },
          { name: 'Project 2' }
        ],
        [
          [{}, {}, {}, { state: 'closed' }, { state: 'closed' }],
          [{}, {}]
        ]
      );
      const component = mountComponent();
      const blocks = component.findAllComponents(ProjectHomeBlock);
      blocks[0].props().maxForms.should.equal(4);
      blocks[0].findAllComponents(FormRow).length.should.equal(3);
      blocks[1].findAllComponents(FormRow).length.should.equal(2);
    });
  });

  describe('duplicate form names', () => {
    beforeEach(mockLogin);

    it('calculates duplicate form names per project', () => {
      createProjectsWithForms(
        [{ name: 'Project 1' }, { name: 'Project 2' }],
        [
          [{ name: 'A', xmlFormId: 'a_1' }, { name: 'A', xmlFormId: 'a_2' }, { name: 'B', xmlFormId: 'b_1' }],
          [{ name: 'C', xmlFormId: 'c_1' }, { name: 'c', xmlFormId: 'c_2' }, { name: 'B', xmlFormId: 'b_1' }]
        ]
      );
      const component = mountComponent();
      const blocks = component.findAllComponents(ProjectHomeBlock);
      blocks[0].findAllComponents(FormRow).map((row) => row.find('.form-name').text()).should.eql([
        'A(a_1)',
        'A(a_2)',
        'B'
      ]);
      blocks[1].findAllComponents(FormRow).map((row) => row.find('.form-name').text()).should.eql([
        'B',
        'c(c_2)',
        'C(c_1)'
      ]);
    });
  });
});

