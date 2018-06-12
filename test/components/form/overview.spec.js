/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
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
        .then(app => app.vm.$route.path.should.equal('/login')));

    it('redirects the user back after login', () => {
      const path = overviewPath(testData.extendedForms.createPast(1).last());
      return mockRouteThroughLogin(path)
        .respondWithData(() => testData.extendedForms.last())
        .respondWithData(() => testData.simpleFieldKeys.sorted())
        .afterResponse(app => app.vm.$route.path.should.equal(path));
    });
  });

  it('shows a success message after login', () =>
    mockRouteThroughLogin(overviewPath(testData.extendedForms.createPast(1).last()))
      .respondWithData(() => testData.extendedForms.last())
      .respondWithData(() => testData.simpleFieldKeys.sorted())
      .afterResponse(app => app.should.alert('success')));

  describe('after login', () => {
    beforeEach(mockLogin);

    describe('no submissions', () => {
      let app;
      beforeEach(() => {
        testData.extendedForms.createPast(1, 'withoutSubmission');
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
        testData.extendedForms.createPast(1, 'withSubmission');
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
        mockRoute(overviewPath(testData.extendedForms.createPast(1, 'open').last()))
          .respondWithData(() => testData.extendedForms.last())
          .respondWithData(() => testData.simpleFieldKeys.sorted())
          .afterResponse(app => {
            const title = app.find('.form-overview-step')[3].first('p');
            title.hasClass('text-muted').should.be.true();
          }));

      it('is marked as complete, if the form is not open', () =>
        mockRoute(overviewPath(testData.extendedForms.createPast(1, 'notOpen').last()))
          .respondWithData(() => testData.extendedForms.last())
          .respondWithData(() => testData.simpleFieldKeys.sorted())
          .afterResponse(app => {
            const title = app.find('.form-overview-step')[3].first('p');
            title.hasClass('text-success').should.be.true();
          }));

      it('is marked as complete if the state is changed from open', () =>
        mockRoute(overviewPath(testData.extendedForms.createPast(1, 'open').last()))
          .respondWithData(() => testData.extendedForms.last())
          .respondWithData(() => testData.simpleFieldKeys.sorted())
          .afterResponse(app => {
            const title = app.find('.form-overview-step')[3].first('p');
            title.hasClass('text-success').should.be.false();

            const { xmlFormId } = testData.extendedForms.last();
            app.vm.$router.push(`/forms/${xmlFormId}/settings`);
            return app.vm.$nextTick().then(() => app);
          })
          .request(app => {
            const formEdit = app.first('#form-edit');
            const closed = formEdit.first('input[type="radio"][value="closed"]');
            return trigger.change(closed).then(() => app);
          })
          .respondWithSuccess()
          .afterResponse(app => {
            app.vm.$router.push(overviewPath(testData.extendedForms.last()));
            return app.vm.$nextTick().then(() => app);
          })
          .then(app => {
            const title = app.find('.form-overview-step')[3].first('p');
            title.hasClass('text-success').should.be.true();
          }));
    });
  });
});
