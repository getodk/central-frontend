import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRoute } from '../../util/http';

const loadOverview = ({
  submissionCount = 0,
  fieldKeyCount = 0,
  formState = 'open'
}) => {
  testData.extendedProjects.createPast(1, {
    forms: 2,
    lastSubmission: new Date().toISOString(),
    appUsers: fieldKeyCount
  });
  testData.extendedForms.createPast(1, {
    xmlFormId: 'f',
    state: formState,
    submissions: submissionCount
  });
  testData.extendedFieldKeys.createPast(fieldKeyCount);
  return mockRoute('/projects/1/forms/f')
    .respondWithData(() => testData.extendedProjects.last())
    .respondWithData(() => testData.extendedForms.last())
    .respondWithData(() => testData.standardFormAttachments.sorted())
    .respondWithData(() =>
      testData.extendedFieldKeys.sorted().map(testData.toActor));
};

describe('FormChecklist', () => {
  beforeEach(mockLogin);

  describe('submission count', () => {
    it('renders correctly if there are no submissions', () =>
      loadOverview({ submissionCount: 0 }).afterResponses(app => {
        const steps = app.find('#form-checklist .checklist-step');
        const step2Text = steps[1].find('p')[1].text();
        step2Text.should.containEql('Nobody has submitted any data to this Form yet.');
        const step3Text = steps[2].find('p')[1].text();
        step3Text.should.containEql('Once there is data for this Form,');
      }));

    it('renders correctly if there is a submission', () =>
      loadOverview({ submissionCount: 12345 }).afterResponses(app => {
        const steps = app.find('#form-checklist .checklist-step');
        const step2Text = steps[1].find('p')[1].text();
        step2Text.should.containEql('12,345');
        const step3Text = steps[2].find('p')[1].text();
        step3Text.should.containEql('12,345');
      }));
  });

  describe('app user count', () => {
    it('renders correctly if there are no app users', () =>
      loadOverview({ fieldKeyCount: 0 }).afterResponses(app => {
        const step = app.find('#form-checklist .checklist-step')[1];
        const text = step.find('p')[1].text();
        text.should.containEql('You have not created any App Users for this Project yet');
      }));

    it('renders correctly if there is one app user', () =>
      loadOverview({ fieldKeyCount: 1 }).afterResponses(app => {
        const step = app.find('#form-checklist .checklist-step')[1];
        const text = step.find('p')[1].text().trim().iTrim();
        text.should.containEql('1 App User');
      }));
  });

  describe('step stages', () => {
    // Array of test cases
    const cases = [
      {
        submissionCount: 0,
        formState: 'open',
        completedSteps: [0],
        currentStep: 1
      },
      {
        submissionCount: 0,
        formState: 'closed',
        completedSteps: [0, 3],
        currentStep: 1
      },
      {
        submissionCount: 2,
        formState: 'open',
        completedSteps: [0, 1],
        currentStep: 2
      },
      {
        submissionCount: 2,
        formState: 'closed',
        completedSteps: [0, 1, 3],
        currentStep: 2
      }
    ];

    for (let i = 0; i < cases.length; i += 1) {
      it(`correctly indicates the stages of the checklist steps for case ${i}`, () => {
        const { completedSteps, currentStep, ...loadOverviewArgs } = cases[i];
        return loadOverview(loadOverviewArgs).afterResponses(app => {
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
      });
    }
  });
});
