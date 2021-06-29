import { RouterLinkStub } from '@vue/test-utils';

import ProjectOverviewRightNow from '../../../../src/components/project/overview/right-now.vue';
import SummaryItem from '../../../../src/components/summary-item.vue';

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';
import { mount } from '../../../util/lifecycle';
import { wait } from '../../../util/util';

const mountComponent = () => mount(ProjectOverviewRightNow, {
  requestData: { project: testData.extendedProjects.last() },
  stubs: { RouterLink: RouterLinkStub },
  mocks: { $route: '/projects/1' }
});

describe('ProjectOverviewRightNow', () => {
  beforeEach(mockLogin);

  describe('app users', () => {
    it('shows the count', () => {
      testData.extendedProjects.createPast(1, { appUsers: 3 });
      const counts = mountComponent().findAll('.summary-item-heading');
      counts.length.should.equal(2);
      counts.at(0).text().should.equal('3');
    });

    it('links to the app users page', () => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      const { routeTo } = mountComponent().getComponent(SummaryItem).props();
      routeTo.should.equal('/projects/1/app-users');
    });
  });

  describe('forms', () => {
    it('shows the count', () => {
      testData.extendedProjects.createPast(1, { forms: 3 });
      const counts = mountComponent().findAll('.summary-item-heading');
      counts.length.should.equal(2);
      counts.at(1).text().should.equal('3');
    });

    it('scrolls down after a click', async () => {
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1', { attachTo: document.body });
      window.pageYOffset.should.equal(0);
      const component = app.getComponent(ProjectOverviewRightNow);
      await component.findAll('.summary-item-icon-container').at(1).trigger('click');
      // Wait for the animation to complete.
      await wait(400);
      window.pageYOffset.should.not.equal(0);
    });
  });
});
