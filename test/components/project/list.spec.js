import ProjectList from '../../../src/components/project/list.vue';
import ProjectHomeBlock from '../../../src/components/project/home-block.vue';

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

describe('ProjectList', () => {
  beforeEach(mockLogin);

  it('renders a row for each project', () => {
    testData.extendedProjects.createPast(2);
    mountComponent().findAllComponents(ProjectHomeBlock).length.should.equal(2);
  });

  it('shows a message if there are no projects', () => {
    // TODO: show something fancier when there are no projects and update test
    mountComponent().get('.empty-table-message').should.be.visible();
  });

  it('shows archived projects at the bottom of the page', () => {
    // TODO
  });

  it('does not show archived header if no archived projects exist', () => {
    // TODO
  });

  it('sorts archived projects according to full project sort', () => {
    // TODO
  });

  it('changes the sort mode from the sort dropdown', () => {
    // TODO
  });

  it('shows the appropriate number of forms based on total project/form numbers', () => {
    // TODO
  });
});

