import ProjectFormWorkflow from '../../../../src/components/project/form-workflow.vue';
import ProjectFormWorkflowStates from '../../../../src/components/project/form-workflow/states.vue';
import testData from '../../../data';
import { mockLogin } from '../../../session';
import { mountAndMark } from '../../../destroy';
import { trigger } from '../../../event';

describe('ProjectFormWorkflowStates', () => {
  beforeEach(mockLogin);

  it('shows the modal after the icon is clicked', () => {
    const component = mountAndMark(ProjectFormWorkflow, {
      propsData: {
        projectId: '1'
      },
      requestData: {
        project: testData.extendedProjects.createPast(1).last(),
        forms: [],
        fieldKeys: [],
        roles: testData.standardRoles.sorted(),
        formAssignments: []
      }
    });
    const modal = component.first(ProjectFormWorkflowStates);
    modal.getProp('state').should.be.false();
    return trigger.click(component, '#project-form-workflow-table th .btn-link')
      .then(() => {
        modal.getProp('state').should.be.true();
      });
  });
});
