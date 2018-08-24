import faker from '../../faker';
import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';
import { trigger } from '../../util';

const overviewPath = (form) => `/forms/${form.xmlFormId}`;

describe('FormOverview', () => {
  describe('anonymous users', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute(overviewPath(testData.extendedForms.createPast(1).last()))
        .restoreSession(false)
        .afterResponse(app => app.vm.$route.path.should.equal('/login')));

    it('redirects the user back after login', () => {
      const path = overviewPath(testData.extendedForms.createPast(1).last());
      return mockRouteThroughLogin(path)
        .respondWithData(() => testData.extendedForms.last())
        .respondWithData(() => testData.simpleFieldKeys.sorted())
        .afterResponse(app => app.vm.$route.path.should.equal(path));
    });
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    describe('no submissions', () => {
      let app;
      beforeEach(() => {
        testData.extendedForms.createPast(1, { hasSubmission: false });
      });
      // Using mockRoute() rather than mockHttp(), because FormOverview uses
      // <router-link>.
      beforeEach(() => mockRoute(overviewPath(testData.extendedForms.last()))
        .respondWithData(() => testData.extendedForms.last())
        .respondWithData(() => testData.simpleFieldKeys.sorted())
        .afterResponse(component => {
          app = component;
        }));

      describe('step 2', () => {
        it('is the current step', () => {
          const title = app.find('.form-overview-step')[1].first('p');
          title.hasClass('text-success').should.be.false();
          title.hasClass('text-muted').should.be.false();
        });

        it('indicates that there are no submissions', () => {
          const p = app.find('.form-overview-step')[1].find('p')[1];
          p.text().trim().should.containEql('Nobody has submitted any data to this form yet.');
        });
      });

      it('step 3 indicates that there are no submissions', () => {
        const p = app.find('.form-overview-step')[2].find('p')[1];
        p.text().trim().should.containEql('Once there is data for this form,');
      });
    });

    describe('form has submissions', () => {
      let app;
      beforeEach(() => {
        testData.extendedForms.createPast(1, { hasSubmission: true });
      });
      beforeEach(() => mockRoute(overviewPath(testData.extendedForms.last()))
        .respondWithData(() => testData.extendedForms.last())
        .respondWithData(() => testData.simpleFieldKeys.sorted())
        .afterResponse(component => {
          app = component;
        }));

      describe('step 2', () => {
        it('is marked as complete', () => {
          const title = app.find('.form-overview-step')[1].first('p');
          title.hasClass('text-success').should.be.true();
        });

        it('shows the number of submissions', () => {
          const p = app.find('.form-overview-step')[1].find('p')[1];
          const count = testData.extendedForms.last().submissions;
          p.text().trim().should.containEql(` ${count.toLocaleString()} `);
        });
      });

      describe('step 3', () => {
        it('is the current step', () => {
          const title = app.find('.form-overview-step')[2].first('p');
          title.hasClass('text-success').should.be.false();
        });

        it('shows the number of submissions', () => {
          const p = app.find('.form-overview-step')[2].find('p')[1];
          const count = testData.extendedForms.last().submissions;
          p.text().trim().should.containEql(` ${count.toLocaleString()} `);
        });
      });
    });

    describe('step 2 indicates the number of app users', () => {
      it('no app users', () =>
        mockRoute(overviewPath(testData.extendedForms.createPast(1).last()))
          .respondWithData(() => testData.extendedForms.last())
          .respondWithData(() => testData.simpleFieldKeys.sorted())
          .afterResponse(app => {
            const p = app.find('.form-overview-step')[1].find('p')[1];
            p.text().trim().should.containEql('You do not have any App Users on this server yet');
          }));

      it('at least one app user', () =>
        mockRoute(overviewPath(testData.extendedForms.createPast(1).last()))
          .respondWithData(() => testData.extendedForms.last())
          .respondWithData(() => {
            const count = faker.random.number({ min: 1, max: 2000 });
            return testData.simpleFieldKeys.createPast(count).sorted();
          })
          .afterResponse(app => {
            const p = app.find('.form-overview-step')[1].find('p')[1];
            const count = testData.simpleFieldKeys.size;
            p.text().trim().should.containEql(` ${count.toLocaleString()} `);
          }));
    });

    describe('step 4', () => {
      it('is not the current step, if the form is open', () =>
        mockRoute(overviewPath(testData.extendedForms.createPast(1, { isOpen: true }).last()))
          .respondWithData(() => testData.extendedForms.last())
          .respondWithData(() => testData.simpleFieldKeys.sorted())
          .afterResponse(app => {
            const title = app.find('.form-overview-step')[3].first('p');
            title.hasClass('text-muted').should.be.true();
          }));

      it('is marked as complete, if the form is not open', () =>
        mockRoute(overviewPath(testData.extendedForms.createPast(1, { isOpen: false }).last()))
          .respondWithData(() => testData.extendedForms.last())
          .respondWithData(() => testData.simpleFieldKeys.sorted())
          .afterResponse(app => {
            const title = app.find('.form-overview-step')[3].first('p');
            title.hasClass('text-success').should.be.true();
          }));

      it('is marked as complete if the state is changed from open', () =>
        mockRoute(overviewPath(testData.extendedForms.createPast(1, { isOpen: true }).last()))
          .respondWithData(() => testData.extendedForms.last())
          .respondWithData(() => testData.simpleFieldKeys.sorted())
          .afterResponse(app => {
            const title = app.find('.form-overview-step')[3].first('p');
            title.hasClass('text-success').should.be.false();
          })
          .route(`/forms/${testData.extendedForms.last().xmlFormId}/settings`)
          .request(app => {
            const formEdit = app.first('#form-edit');
            const closed = formEdit.first('input[type="radio"][value="closed"]');
            return trigger.change(closed).then(() => app);
          })
          .respondWithSuccess()
          .complete()
          .route(overviewPath(testData.extendedForms.last()))
          .then(app => {
            const title = app.find('.form-overview-step')[3].first('p');
            title.hasClass('text-success').should.be.true();
          }));
    });
  });
});
