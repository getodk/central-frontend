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
import Form from '../../../lib/presenters/form';
import FormList from '../../../lib/components/form/list.vue';
import testData from '../../data';
import { formatDate } from '../../../lib/util';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin, mockRouteThroughLogin } from '../../session';

describe('FormList', () => {
  describe('routing', () => {
    it('anonymous user is redirected to login', () =>
      mockRoute('/forms')
        .then(app => app.vm.$route.path.should.equal('/login')));

    it('after login, user is redirected back', () =>
      mockRouteThroughLogin('/forms')
        .respondWithData(() => testData.extendedForms.createPast(1).sorted())
        .afterResponse(app => app.vm.$route.path.should.equal('/forms')));
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    it('table contains the correct data', () => {
      const forms = testData.extendedForms.createPast(2).sorted();
      // Mocking the route, because the table uses <router-link>.
      return mockRoute('/forms')
        .respondWithData(() => forms)
        .afterResponse(page => {
          const tr = page.find('table tbody tr');
          tr.length.should.equal(forms.length);
          for (let i = 0; i < tr.length; i += 1) {
            const td = tr[i].find('td');
            td.length.should.equal(4);
            const form = new Form(forms[i]);

            // First column
            const nameOrId = td[0].first('.form-list-form-name').text().trim();
            nameOrId.should.equal(form.nameOrId());
            if (form.name != null) {
              const xmlFormId = td[0].first('.form-list-form-id').text().trim();
              xmlFormId.should.equal(form.xmlFormId);
            }
            const submissions = td[0].first('.form-list-submissions').text().trim();
            submissions.should.containEql(form.submissions.toLocaleString());

            td[1].text().trim().should.equal(form.createdBy != null
              ? form.createdBy.displayName
              : '');
            td[2].text().trim().should.equal(formatDate(form.updatedOrCreatedAt()));
            td[3].text().trim().should.equal(formatDate(form.lastSubmission));
          }
        });
    });

    it('shows a message if there are no forms', () =>
      mockHttp()
        .mount(FormList)
        .respondWithData(() => [])
        .afterResponse(page => {
          const text = page.first('#page-body p').text().trim();
          text.should.equal('To get started, add a form.');
        }));

    it('refreshes after the refresh button is clicked', () =>
      mockRoute('/forms')
        .testRefreshButton({ collection: testData.extendedForms }));
  });
});
