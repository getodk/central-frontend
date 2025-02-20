import { RouterLinkStub } from '@vue/test-utils';

import { nextTick } from 'vue';
import ProjectOverviewDescription from '../../../../src/components/project/overview/description.vue';

import { mockRouter } from '../../../util/router';
import { mount } from '../../../util/lifecycle';

const mountComponent = (props, attachTo) => mount(ProjectOverviewDescription, {
  props,
  container: { router: mockRouter('/projects/1') },
  attachTo
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
    component.find('*').exists().should.be.false; // component is empty
  });

  it('renders router link to project settings', () => {
    const { to } = mountComponent({ canUpdate: true }).getComponent(RouterLinkStub).props();
    to.should.equal('/projects/1/settings');
  });

  describe('collapsed', () => {
    const description = 'line1\nline2\nline3\nline4\nline5';

    it('is collapsed if there are more than 4 lines of description', async () => {
      const component = mountComponent({ description, canUpdate: false }, document.body);
      await nextTick();
      component.find('#project-overview-description').attributes('style').should.match(/height: .*px/);
    });

    it('should expand on click', async () => {
      const component = mountComponent({ description, canUpdate: false }, document.body);
      await nextTick();
      await component.find('#project-overview-description').trigger('click');
      component.find('#project-overview-description').attributes('style').should.match(/height: auto/);
    });
  });
});
