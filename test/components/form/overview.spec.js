import faker from '../../faker';
import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';
import { trigger } from '../../util';

const overviewPath = (form) =>
  `/projects/1/forms/${encodeURIComponent(form.xmlFormId)}`;

describe('FormOverview', () => {
  describe('anonymous users', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/projects/1/forms/x')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () => {
      const project = testData.simpleProjects.createPast(1).last();
      const form = testData.extendedForms.createPast(1).last();
      return mockRouteThroughLogin(overviewPath(form))
        .respondWithData(() => project)
        .respondWithData(() => form)
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        .respondWithData(() => testData.simpleFieldKeys.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal(overviewPath(form));
        });
    });
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    const loadOverview = ({
      attachmentCount = 0,
      allAttachmentsExist,
      hasSubmission = false,
      formIsOpen = true,
      fieldKeyCount = 0
    }) => {
      testData.extendedProjects.createPast(1);
      const state = formIsOpen
        ? 'open'
        : faker.random.arrayElement(['closing', 'closed']);
      const submissions = hasSubmission ? faker.random.number({ min: 1 }) : 0;
      testData.extendedForms.createPast(1, { state, submissions });
      if (attachmentCount !== 0) {
        testData.extendedFormAttachments.createPast(
          attachmentCount,
          { exists: allAttachmentsExist }
        );
      }
      // Using mockRoute() rather than mockHttp(), because FormOverview uses
      // <router-link>.
      return mockRoute(overviewPath(testData.extendedForms.last()))
        .respondWithData(() => testData.simpleProjects.last())
        .respondWithData(() => testData.extendedForms.last())
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        // Not using testData, because fieldKeyCount may be fairly large, and
        // the component only uses the array length.
        .respondWithData(() => new Array(fieldKeyCount));
    };

    describe('submission count', () => {
      it('no submissions', () =>
        loadOverview({ hasSubmission: false }).afterResponses(app => {
          app.find('.form-overview-step')[2].find('p')[1].text().trim()
            .should.containEql('Nobody has submitted any data to this form yet.');
          app.find('.form-overview-step')[3].find('p')[1].text().trim()
            .should.containEql('Once there is data for this form,');
        }));

      it('at least one submission', () =>
        loadOverview({ hasSubmission: true }).afterResponses(app => {
          const count = testData.extendedForms.last().submissions
            .toLocaleString();
          app.find('.form-overview-step')[2].find('p')[1].text().trim()
            .should.containEql(count);
          app.find('.form-overview-step')[3].find('p')[1].text().trim()
            .should.containEql(count);
        }));
    });

    describe('app user count', () => {
      it('no app users', () =>
        loadOverview({ fieldKeyCount: 0 }).afterResponses(app => {
          app.find('.form-overview-step')[2].find('p')[1].text().trim()
            .should.containEql('You do not have any App Users on this server yet');
        }));

      it('at least one app user', () => {
        const fieldKeyCount = 1000;
        return loadOverview({ fieldKeyCount }).afterResponses(app => {
          app.find('.form-overview-step')[2].find('p')[1].text().trim()
            .should.containEql(fieldKeyCount.toLocaleString());
        });
      });
    });

    it('marks step 5 as complete if form state is changed from open', () =>
      loadOverview({ formIsOpen: true })
        .afterResponses(app => {
          const title = app.find('.form-overview-step')[4].first('p');
          title.hasClass('text-success').should.be.false();
        })
        .route(`/projects/1/forms/${testData.extendedForms.last().xmlFormId}/settings`)
        .request(app => {
          const formEdit = app.first('#form-edit');
          const closed = formEdit.first('input[type="radio"][value="closed"]');
          return trigger.change(closed);
        })
        .respondWithSuccess()
        .complete()
        .route(overviewPath(testData.extendedForms.last()))
        .then(app => {
          const title = app.find('.form-overview-step')[4].first('p');
          title.hasClass('text-success').should.be.true();
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

      // Tests the stages of the form overview steps for a single test case.
      const testStepStages = ({ completedSteps, currentStep, ...loadOverviewArgs }) =>
        loadOverview(loadOverviewArgs).afterResponses(app => {
          const steps = app.find('.form-overview-step');
          steps.length.should.equal(5);
          for (let i = 0; i < steps.length; i += 1) {
            const heading = steps[i].first('.form-overview-step-heading');
            const icon = heading.first('.icon-check-circle');
            if (completedSteps.includes(i)) {
              heading.hasClass('text-success').should.be.true();
              heading.hasClass('text-muted').should.be.false();
              icon.hasClass('text-muted').should.be.false();
            } else if (i === currentStep) {
              heading.hasClass('text-success').should.be.false();
              heading.hasClass('text-muted').should.be.false();
              icon.hasClass('text-muted').should.be.true();
            } else {
              heading.hasClass('text-success').should.be.false();
              heading.hasClass('text-muted').should.be.true();
              icon.hasClass('text-muted').should.be.true();
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
});
