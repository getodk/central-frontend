import ProjectIntroduction from '../../../src/components/project/introduction.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ProjectIntroduction', () => {
  beforeEach(mockLogin);

  describe('link to show modal', () => {
    it('shows the link in a fresh install', async () => {
      testData.extendedProjects.createPast(1, { name: 'Default Project' });
      const component = await load('/', { root: false });
      component.get('.project-row a[href="#"]').should.be.visible();
    });

    it('does not render the link if there are multiple projects', async () => {
      testData.extendedProjects
        .createPast(1, { name: 'Default Project' })
        .createPast(1, { name: 'Second Project' });
      const component = await load('/', { root: false });
      component.find('.project-row a[href="#"]').exists().should.be.false();
    });
  });

  it('toggles the modal', () => {
    testData.extendedProjects.createPast(1, { name: 'Default Project' });
    return load('/', { root: false }).testModalToggles({
      modal: ProjectIntroduction,
      show: '.project-row a[href="#"]',
      hide: '.btn-primary'
    });
  });
});
