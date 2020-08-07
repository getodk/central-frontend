import ProjectIntroduction from '../../../src/components/project/introduction.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('ProjectIntroduction', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedProjects.createPast(1, { name: 'Default Project' });
  });

  it('toggles the modal', () =>
    load('/').testModalToggles(
      ProjectIntroduction,
      '.project-row a[href="#"]',
      '.btn-primary'
    ));
});
