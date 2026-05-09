import ProjectFormAccessStates from '../../../../src/components/project/form-access/states.vue';

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';

describe('ProjectFormAccessStates', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    testData.extendedProjects.createPast(1);
    return load('/projects/1/form-access').testModalToggles({
      modal: ProjectFormAccessStates,
      show: '#project-form-access-table th .btn-link',
      hide: '.btn-primary'
    });
  });
});
