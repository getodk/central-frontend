import ProjectList from '../../../src/components/project/list.vue';
import ProjectRow from '../../../src/components/project/row.vue';

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
    mountComponent().findAllComponents(ProjectRow).length.should.equal(2);
  });

  it('shows a message if there are no projects', () => {
    mountComponent().get('.empty-table-message').should.be.visible();
  });
});
