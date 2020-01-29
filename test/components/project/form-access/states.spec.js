import ProjectFormAccess from '../../../../src/components/project/form-access.vue';
import ProjectFormAccessStates from '../../../../src/components/project/form-access/states.vue';
import testData from '../../../data';
import { mockLogin } from '../../../util/session';
import { mountAndMark } from '../../../util/destroy';
import { trigger } from '../../../util/event';

describe('ProjectFormAccessStates', () => {
  beforeEach(mockLogin);

  it('shows the modal after the icon is clicked', () => {
    const component = mountAndMark(ProjectFormAccess, {
      propsData: {
        projectId: '1'
      },
      requestData: {
        project: testData.extendedProjects.createPast(1).last(),
        forms: [],
        fieldKeys: [],
        roles: testData.standardRoles.sorted(),
        formSummaryAssignments: []
      }
    });
    const modal = component.first(ProjectFormAccessStates);
    modal.getProp('state').should.be.false();
    return trigger.click(component, '#project-form-access-table th .btn-link')
      .then(() => {
        modal.getProp('state').should.be.true();
      });
  });
});
