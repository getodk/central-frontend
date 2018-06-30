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
import axios from 'axios';

import FormSubmissions from '../../../lib/components/form/submissions.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { trigger } from '../../util';

const submissionsPath = (form) => `/forms/${form.xmlFormId}/submissions`;

describe('FormSubmissions', () => {
  describe('routing', () => {
    it('anonymous user is redirected to login', () =>
      mockRoute(submissionsPath(testData.extendedForms.createPast(1).first()))
        .then(app => app.vm.$route.path.should.equal('/login')));

    it('after login, user is redirected back', () => {
      const path = submissionsPath(testData.extendedForms.createPast(1).first());
      return mockRouteThroughLogin(path)
        .respondWithData(() => testData.extendedForms.first())
        .respondWithData(() => testData.extendedSubmissions.createPast(1).sorted())
        .afterResponses(app => app.vm.$route.path.should.equal(path));
    });
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    const propsData = () => {
      const props = { form: testData.extendedForms.firstOrCreatePast() };
      return { propsData: props };
    };

    it('table contains the correct data', () => {
      const submissions = testData.extendedSubmissions.createPast(2).sorted();
      return mockHttp()
        .mount(FormSubmissions, propsData())
        .respondWithData(() => submissions)
        .afterResponse(page => {
          const tr = page.find('table tbody tr');
          tr.length.should.equal(submissions.length);
          for (let i = 0; i < tr.length; i += 1) {
            const td = tr[i].find('td');
            td.length.should.equal(3);
            const submission = submissions[i];
            td[0].text().trim().should.equal(submission.instanceId);
            td[1].text().trim().should.equal(submission.submitter != null
              ? submission.submitter.displayName
              : '');
          }
        });
    });

    it('refreshes after the refresh button is clicked', () =>
      mockRoute(submissionsPath(testData.extendedForms.createPast(1).last()))
        .respondWithData(() => testData.extendedForms.last())
        .testRefreshButton(testData.extendedSubmissions));

    describe('download', () => {
      it('download button shows number of submissions', () =>
        mockHttp()
          .mount(FormSubmissions, propsData())
          .respondWithData(() => testData.extendedSubmissions.createPast(2).sorted())
          .afterResponse(page => {
            const button = page.first('#form-submissions-download-button');
            const count = testData.extendedSubmissions.size;
            button.text().trim().should.equal(`Download all ${count} records`);
          }));

      it('clicking download button downloads a .zip file', () => {
        let clicked = false;
        let href;
        let download;
        const zipContents = 'zip contents';
        return mockHttp()
          .mount(FormSubmissions, propsData())
          .respondWithData(() => testData.extendedSubmissions.createPast(1).sorted())
          .complete()
          .request(page => {
            $(page.element).find('a[download]').first().click((event) => {
              clicked = true;
              const $a = $(event.currentTarget);
              href = $a.attr('href');
              download = $a.attr('download');
            });
            trigger.click(page.first('#form-submissions-download-button'));
          })
          .respondWithData(() => new Blob([zipContents]))
          .afterResponse(page => {
            clicked.should.be.true();
            href.should.startWith('blob:');
            href.should.equal(page.data().downloadHref);
            const { xmlFormId } = testData.extendedForms.first();
            download.should.equal(`${xmlFormId}.zip`);
          })
          .then(() => axios.get(href))
          .then(response => response.data.should.equal(zipContents));
      });
    });

    describe('no submissions', () => {
      it('shows a message', () =>
        mockHttp()
          .mount(FormSubmissions, propsData())
          .respondWithData(() => [])
          .afterResponse(component => {
            const text = component.first('p').text().trim();
            text.should.startWith('There are no submissions yet');
          }));

      it('does not show the download button', () =>
        mockHttp()
          .mount(FormSubmissions, propsData())
          .respondWithData(() => [])
          .afterResponse(component => {
            component.find('#form-submissions-download-button').should.be.empty();
          }));

      it('does not show the analyze button', () =>
        mockHttp()
          .mount(FormSubmissions, propsData())
          .respondWithData(() => [])
          .afterResponse(component => {
            component.find('#form-submissions-analyze-button').should.be.empty();
          }));
    });
  });
});
