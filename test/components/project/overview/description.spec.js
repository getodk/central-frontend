import { RouterLinkStub } from '@vue/test-utils';

import ProjectOverviewDescription from '../../../../src/components/project/overview/description.vue';

import { mockRouter } from '../../../util/router';
import { mount } from '../../../util/lifecycle';

const mountComponent = (props) => mount(ProjectOverviewDescription, {
  props,
  container: { router: mockRouter('/projects/1') }
});

describe('ProjectOverviewDescription', () => {
  it('shows description if set for >= managers (can update)', () => {
    const component = mountComponent({ description: 'desc', canUpdate: true });
    component.find('#project-overview-description').text().should.equal('desc');
  });

  it('shows description if set for < managers (cannot update)', () => {
    const component = mountComponent({ description: 'desc', canUpdate: false });
    component.find('#project-overview-description').text().should.equal('desc');
  });

  it('shows instructions if description is empty', () => {
    const component = mountComponent({ description: '', canUpdate: true });
    component.find('#project-overview-description-update').text().should.startWith('Add Project notes');
  });

  it('shows instructions if description is null', () => {
    const component = mountComponent({ canUpdate: true });
    component.find('#project-overview-description-update').text().should.startWith('Add Project notes');
  });

  it('shows nothing if empty description and cannot update', () => {
    const component = mountComponent({ canUpdate: false });
    component.find('*').exists().should.be.false(); // component is empty
  });

  it('renders router link to project settings', () => {
    const { to } = mountComponent({ canUpdate: true }).getComponent(RouterLinkStub).props();
    to.should.equal('/projects/1/settings');
  });
});
