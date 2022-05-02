import { RouterLinkStub } from '@vue/test-utils';

import ProjectHomeBlock from '../../../src/components/project/home-block.vue';

import Project from '../../../src/presenters/project';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(ProjectHomeBlock, {
  props: {
    project: new Project(testData.extendedProjects.last()),
    sortFunc: (x) => x
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
    // TODO
  });

  it('sorts the right thing when there are zero forms', () => {
    // TODO
  });

  it('shows the correct number of forms if there are only a few', () => {
    // TODO
  });

  it('shows the correct number of forms if there are a lot and some should be hidden', () => {
    // TODO
  });

  it('expands the forms to show more forms', () => {
    // TODO
  });

  it('sorts the forms by the same sort function', () => {
    // TODO
  });

  it('shows different forms depending on cutoff and sort func', () => {
    // TODO
  });
});
