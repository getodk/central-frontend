import ProjectSubmissionOptions from '../../../src/components/project/submission-options.vue';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { load } from '../../util/http';

describe('FormChecklist', () => {
  beforeEach(mockLogin);

  describe('submission count', () => {
    it('renders correctly if there are no submissions', async () => {
      testData.extendedForms.createPast(1, { submissions: 0 });
      const app = await load('/projects/1/forms/f');
      const steps = app.find('#form-checklist .checklist-step');
      const step2Text = steps[1].find('p')[1].text();
      step2Text.should.containEql('Nobody has submitted any data to this Form yet.');
      const step3Text = steps[2].find('p')[1].text();
      step3Text.should.containEql('Once there is data for this Form,');
    });

    it('renders correctly if there is a submission', async () => {
      testData.extendedForms.createPast(1, { submissions: 12345 });
      const app = await load('/projects/1/forms/f');
      const steps = app.find('#form-checklist .checklist-step');
      const step2Text = steps[1].find('p')[1].text();
      step2Text.should.containEql('12,345');
      const step3Text = steps[2].find('p')[1].text();
      step3Text.should.containEql('12,345');
    });
  });

  it('toggles the "Submission Options" modal', () => {
    testData.extendedForms.createPast(1);
    return load('/projects/1/forms/f').testModalToggles(
      ProjectSubmissionOptions,
      '#form-checklist a[href="#"]',
      '.btn-primary'
    );
  });

  describe('step stages', () => {
    // Array of test cases
    const cases = [
      {
        form: { state: 'open', submissions: 0 },
        completedSteps: [0],
        currentStep: 1
      },
      {
        form: { state: 'closed', submissions: 0 },
        completedSteps: [0, 3],
        currentStep: 1
      },
      {
        form: { state: 'open', submissions: 2 },
        completedSteps: [0, 1],
        currentStep: 2
      },
      {
        form: { state: 'closed', submissions: 2 },
        completedSteps: [0, 1, 3],
        currentStep: 2
      }
    ];

    for (let i = 0; i < cases.length; i += 1) {
      it(`correctly indicates stages of checklist steps for case ${i}`, async () => {
        const { form, completedSteps, currentStep } = cases[i];
        testData.extendedForms.createPast(1, form);
        const app = await load('/projects/1/forms/f');
        const steps = app.find('#form-checklist .checklist-step');
        steps.length.should.equal(4);
        for (let j = 0; j < steps.length; j += 1) {
          if (completedSteps.includes(j)) {
            steps[j].hasClass('checklist-step-complete').should.be.true();
          } else if (j === currentStep) {
            steps[j].hasClass('checklist-step-current').should.be.true();
          } else {
            steps[j].hasClass('checklist-step-later').should.be.true();
          }
        }
      });
    }
  });
});
