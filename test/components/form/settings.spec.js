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
import testData from '../../data';
import { mockRoute } from '../../http';
import { mockRouteThroughLogin } from '../../session';

const settingsPath = (form) => `/forms/${form.xmlFormId}/settings`;

describe('FormSettings', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute(settingsPath(testData.extendedForms.createPast(1).last()))
        .then(app => app.vm.$route.path.should.equal('/login')));

    it('redirects the user back after login', () => {
      const path = settingsPath(testData.extendedForms.createPast(1).last());
      return mockRouteThroughLogin(path)
        .respondWithData(() => testData.extendedForms.last())
        .afterResponse(app => app.vm.$route.path.should.equal(path));
    });
  });
});
