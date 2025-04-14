/*
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

import { useRoute } from 'vue-router';
import { memoizeForContainer } from '../util/composable';
import { queryString } from '../util/request';

import useRoutes from './routes';


export default memoizeForContainer(({ router, requestData }) => {
  const route = useRoute();
  const { form } = requestData;
  const { submissionPath, newSubmissionPath, formPreviewPath, offlineSubmissionPath } = useRoutes();

  const ensureCanonicalPath = (actionType) => {
    let target;

    // We can redirect to canonical path only if Form data exists and session token `st` is not
    // provided in the URL. If `st` is provided in the URL then it means that it is a public link
    if (route.path.startsWith('/f/') && !route.query.st && form.dataExists) {
      if (actionType === 'new') {
        target = newSubmissionPath(form.projectId, form.xmlFormId, !form.publishedAt);
      } else if (actionType === 'edit') {
        // note: we don't support editing of draft submissions
        // if route.query.instance_id is not there then it will not match any path and page not found
        // will be displayed.
        target = submissionPath(form.projectId, form.xmlFormId, route.query.instance_id ?? '', 'edit');
      } else if (actionType === 'preview') {
        target = formPreviewPath(form.projectId, form.xmlFormId, !form.publishedAt);
      } else if (actionType === 'offline') {
        target = offlineSubmissionPath(form.projectId, form.xmlFormId, !form.publishedAt);
      } else if (actionType === 'public-link') {
      // if it is public link without st and we got the data then it means user is logged in
        target = newSubmissionPath(form.projectId, form.xmlFormId, !form.publishedAt);
      }

      if (target) {
        router.replace(`${target}${queryString(route.query)}`);
      }
    }
  };

  return {
    ensureCanonicalPath
  };
});
