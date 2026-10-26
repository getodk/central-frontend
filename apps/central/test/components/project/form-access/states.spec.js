import ProjectFormAccessStates from '../../../../src/components/project/form-access/states.vue';

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';
import { mount } from '../../../util/lifecycle';

const mountComponent = () => mount(ProjectFormAccessStates, {
  props: { state: true }
});

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

  it('shows text about each form state', () => {
    const modal = mountComponent();

    modal.findAll('dt').map(dt => dt.text()).should.eql(['Open', 'Closing', 'Closed']);

    const dd = modal.findAll('dd').map(wrapper => wrapper.text());
    dd.length.should.equal(3);
    dd[0].should.include('submissions can be started and submitted.');
    dd[1].should.include('submissions already in progress can still be submitted.');
    dd[2].should.include('submissions can’t be submitted.');
  });
});
