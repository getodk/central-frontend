import { RouterLinkStub } from '@vue/test-utils';

import ChecklistStep from '../../../src/components/checklist-step.vue';
import FormChecklist from '../../../src/components/form/checklist.vue';
import ProjectSubmissionOptions from '../../../src/components/project/submission-options.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(FormChecklist, {
  requestData: {
    project: testData.extendedProjects.last(),
    form: testData.extendedForms.last()
  },
  stubs: { RouterLink: RouterLinkStub },
  mocks: { $route: '/projects/1/forms/f' }
});

describe('FormChecklist', () => {
  beforeEach(mockLogin);

  describe('Publish your first Draft version', () => {
    it('is marked as complete', () => {
      testData.extendedForms.createPast(1);
      const { stage } = mountComponent().getComponent(ChecklistStep).props();
      stage.should.equal('complete');
    });
  });

  describe('Download Form on survey clients and submit data', () => {
    it('renders correctly if there are no submissions', () => {
      testData.extendedForms.createPast(1, { submissions: 0 });
      const step = mountComponent().findAllComponents(ChecklistStep).at(1);
      step.props().stage.should.equal('current');
      const text = step.findAll('p').at(1).text();
      text.should.startWith('Nobody has submitted any data to this Form yet.');
    });

    it('renders correctly if there is a submission', () => {
      testData.extendedForms.createPast(1, { submissions: 12345 });
      const step = mountComponent().findAllComponents(ChecklistStep).at(1);
      step.props().stage.should.equal('complete');
      step.findAll('p').at(1).text().should.containEql('12,345');
    });

    it('toggles the "Submission Options" modal', () => {
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f', { root: false }).testModalToggles({
        modal: ProjectSubmissionOptions,
        show: '#form-checklist a[href="#"]',
        hide: '.btn-primary'
      });
    });
  });

  describe('Evaluate and analyze submitted data', () => {
    it('renders correctly if there are no submissions', () => {
      testData.extendedForms.createPast(1);
      const step = mountComponent().findAllComponents(ChecklistStep).at(2);
      step.props().stage.should.equal('later');
      const text = step.findAll('p').at(1).text();
      text.should.startWith('Once there is data for this Form,');
    });

    it('renders correctly if there is a submission', () => {
      testData.extendedForms.createPast(1, { submissions: 12345 });
      const step = mountComponent().findAllComponents(ChecklistStep).at(2);
      step.props().stage.should.equal('current');
      step.findAll('p').at(1).text().should.containEql('12,345');
    });
  });

  describe('Manage Form retirement', () => {
    it('is marked as a later step if the form is open', () => {
      testData.extendedForms.createPast(1, { state: 'open', submissions: 1 });
      const step = mountComponent().findAllComponents(ChecklistStep).at(3);
      step.props().stage.should.equal('later');
    });

    it('is marked as complete if the form is closed', () => {
      testData.extendedForms.createPast(1, { state: 'closed' });
      const step = mountComponent().findAllComponents(ChecklistStep).at(3);
      step.props().stage.should.equal('complete');
    });
  });
});
