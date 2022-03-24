import { RouterLinkStub } from '@vue/test-utils';

import ProjectList from '../../../src/components/project/list.vue';
import ProjectRow from '../../../src/components/project/row.vue';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(ProjectList, {
  requestData: { projects: testData.extendedProjects.sorted() },
  stubs: { RouterLink: RouterLinkStub },
  mocks: { $route: '/' }
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
