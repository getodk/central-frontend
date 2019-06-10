import faker from '../../faker';
import testData from '../../data';
import { mockLogin } from '../../session';
import { mockRoute } from '../../http';
import { trigger } from '../../util';

describe('FormChecklist', () => {
  beforeEach(mockLogin);

  const loadOverview = ({
    attachmentCount = 0,
    allAttachmentsExist,
    hasSubmission = false,
    formIsOpen = true,
    fieldKeyCount = 0
  }) => {
    testData.extendedProjects.createPast(1, { appUsers: fieldKeyCount });
    const state = formIsOpen
      ? 'open'
      : faker.random.arrayElement(['closing', 'closed']);
    const submissions = hasSubmission ? faker.random.number({ min: 1 }) : 0;
    testData.extendedForms
      .createPast(1, { xmlFormId: 'f', state, submissions });
    if (attachmentCount !== 0) {
      testData.extendedFormAttachments.createPast(
        attachmentCount,
        { exists: allAttachmentsExist }
      );
    }
    return mockRoute('/projects/1/forms/f')
      .respondWithData(() => testData.extendedProjects.last())
      .respondWithData(() => testData.extendedForms.last())
      .respondWithData(() => testData.extendedFormAttachments.sorted());
  };

  describe('submission count', () => {
    it('no submissions', () =>
      loadOverview({ hasSubmission: false }).afterResponses(app => {
        const steps = app.find('.form-checklist-step');
        const step3Text = steps[2].find('p')[1].text().trim();
        step3Text.should.containEql('Nobody has submitted any data to this Form yet.');
        const step4Text = steps[3].find('p')[1].text().trim();
        step4Text.should.containEql('Once there is data for this Form,');
      }));

    it('at least one submission', () =>
      loadOverview({ hasSubmission: true }).afterResponses(app => {
        const count = testData.extendedForms.last().submissions
          .toLocaleString();
        app.find('.form-checklist-step')[2].find('p')[1].text().trim()
          .should.containEql(count);
        app.find('.form-checklist-step')[3].find('p')[1].text().trim()
          .should.containEql(count);
      }));
  });

  describe('app user count', () => {
    it('no app users', () =>
      loadOverview({ fieldKeyCount: 0 }).afterResponses(app => {
        const step = app.find('.form-checklist-step')[2];
        const text = step.find('p')[1].text().trim();
        text.should.containEql('You have not created any App Users for this Project yet');
      }));

    it('at least one app user', () =>
      loadOverview({ fieldKeyCount: 1 }).afterResponses(app => {
        const step = app.find('.form-checklist-step')[2];
        const text = step.find('p')[1].text().trim().iTrim();
        text.should.containEql('1 App User');
      }));
  });

  it('marks step 5 as complete if form state is changed from open', () =>
    loadOverview({ formIsOpen: true })
      .afterResponses(app => {
        const step = app.find('.form-checklist-step')[4];
        step.hasClass('form-checklist-step-complete').should.be.false();
      })
      .route('/projects/1/forms/f/settings')
      .request(app => trigger.change(app, '#form-edit input[value="closed"]'))
      .respondWithData(() => {
        testData.extendedForms.update(testData.extendedForms.last(), {
          state: 'closed'
        });
        return testData.standardForms.last();
      })
      .complete()
      .route('/projects/1/forms/f')
      .then(app => {
        const step = app.find('.form-checklist-step')[4];
        step.hasClass('form-checklist-step-complete').should.be.true();
      }));

  describe('step stages', () => {
    // Array of test cases
    const cases = [
      {
        allAttachmentsExist: false,
        hasSubmission: false,
        formIsOpen: false,
        completedSteps: [0, 4],
        currentStep: 1
      },
      {
        allAttachmentsExist: false,
        hasSubmission: false,
        formIsOpen: true,
        completedSteps: [0],
        currentStep: 1
      },
      {
        allAttachmentsExist: false,
        hasSubmission: true,
        formIsOpen: false,
        completedSteps: [0, 2, 4],
        currentStep: 1
      },
      {
        allAttachmentsExist: false,
        hasSubmission: true,
        formIsOpen: true,
        completedSteps: [0, 2],
        currentStep: 1
      },
      {
        allAttachmentsExist: true,
        hasSubmission: false,
        formIsOpen: false,
        completedSteps: [0, 1, 4],
        currentStep: 2
      },
      {
        allAttachmentsExist: true,
        hasSubmission: false,
        formIsOpen: true,
        completedSteps: [0, 1],
        currentStep: 2
      },
      {
        allAttachmentsExist: true,
        hasSubmission: true,
        formIsOpen: false,
        completedSteps: [0, 1, 2, 4],
        currentStep: 3
      },
      {
        allAttachmentsExist: true,
        hasSubmission: true,
        formIsOpen: true,
        completedSteps: [0, 1, 2],
        currentStep: 3
      }
    ];

    // Tests the stages of the checklist steps for a single test case.
    const testStepStages = ({ completedSteps, currentStep, ...loadOverviewArgs }) =>
      loadOverview(loadOverviewArgs).afterResponses(app => {
        const steps = app.find('.form-checklist-step');
        steps.length.should.equal(5);
        for (let i = 0; i < steps.length; i += 1) {
          if (completedSteps.includes(i)) {
            steps[i].hasClass('form-checklist-step-complete').should.be.true();
          } else if (i === currentStep) {
            steps[i].hasClass('form-checklist-step-current').should.be.true();
          } else {
            steps[i].hasClass('form-checklist-step-later').should.be.true();
          }
        }
      });

    for (let i = 0; i < cases.length; i += 1) {
      const testCase = cases[i];
      describe(`case ${i}`, () => {
        it('1 attachment', () =>
          testStepStages({ ...cases[i], attachmentCount: 1 }));

        if (testCase.allAttachmentsExist) {
          it('no attachments', () =>
            testStepStages({ ...cases[i], attachmentCount: 0 }));
        }
      });
    }
  });
});
