/*
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

// useRoutes() returns functions related to the router.

import { useRoute } from 'vue-router';

import { canRoute } from '../util/router';
import { memoizeForContainer } from '../util/composable';

const _projectPath = (id, suffix = '') => {
  const slash = suffix !== '' ? '/' : '';
  return `/projects/${id}${slash}${suffix}`;
};
const _formPath = (projectId, xmlFormId, suffix = '') => {
  const encodedFormId = encodeURIComponent(xmlFormId);
  const slash = suffix !== '' ? '/' : '';
  return `/projects/${projectId}/forms/${encodedFormId}${slash}${suffix}`;
};
const _datasetPath = (projectId, datasetName, suffix = '') => {
  const encodedName = encodeURIComponent(datasetName);
  const slash = suffix !== '' ? '/' : '';
  return `/projects/${projectId}/entity-lists/${encodedName}${slash}${suffix}`;
};

export default memoizeForContainer(({ router, requestData }) => {
  const route = useRoute();

  const canRouteToLocation = (location) =>
    canRoute(router.resolve(location), route, requestData);

  /*
  Returns a path to a project page. Do not use projectPath() for Backend paths:
  use apiPaths instead.

  Examples:

  projectPath(1, 'app-users')  // '/projects/1/app-users'
  projectPath(1)               // '/projects/1'

  If the project id is not specified, it is inferred from route params:

  projectPath('app-users')
  projectPath()
  */
  const projectPath = (idOrSuffix, suffix) =>
    (suffix != null || typeof idOrSuffix === 'number'
      ? _projectPath(idOrSuffix, suffix)
      : _projectPath(route.params.projectId, idOrSuffix));

  /*
  Returns a path to a form page. Do not use formPath() for Backend paths: use
  apiPaths instead.

  Examples:

  formPath(1, 'f', 'submissions')  // '/projects/1/forms/f/submissions'
  formPath(1, 'f')                 // '/projects/1/forms/f'

  If projectId and xmlFormId are not specified, they are inferred from route
  params:

  formPath('submissions')
  formPath()
  */
  const formPath = (projectIdOrSuffix, xmlFormId, suffix) => {
    if (xmlFormId == null) {
      const { params } = route;
      return _formPath(params.projectId, params.xmlFormId, projectIdOrSuffix);
    }
    return _formPath(projectIdOrSuffix, xmlFormId, suffix);
  };
  const publishedFormPath = (projectId, xmlFormId) => {
    const path = formPath(projectId, xmlFormId);
    // A project viewer can't navigate to the form overview, but anyone who can
    // navigate to the form should be able to navigate to .../submissions.
    return canRouteToLocation(path) ? path : `${path}/submissions`;
  };
  // Returns the path to the primary page for a form. This changes based on the
  // current user's role, as well as whether the form has a published version.
  const primaryFormPath = (form) => {
    if (form.publishedAt != null) {
      return publishedFormPath(form.projectId, form.xmlFormId);
    } else { // eslint-disable-line no-else-return
      const path = formPath(form.projectId, form.xmlFormId, 'draft');
      return canRouteToLocation(path) ? path : `${path}/testing`;
    }
  };

  const submissionPath = (projectId, xmlFormId, instanceId) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedInstanceId = encodeURIComponent(instanceId);
    return `/projects/${projectId}/forms/${encodedFormId}/submissions/${encodedInstanceId}`;
  };

  const datasetPath = (projectIdOrSuffix, datasetName, suffix) => {
    if (datasetName == null) {
      const { params } = route;
      return _datasetPath(params.projectId, params.datasetName, projectIdOrSuffix);
    }
    return _datasetPath(projectIdOrSuffix, datasetName, suffix);
  };

  const entityPath = (projectId, datasetName, entityUuid) => {
    const encodedName = encodeURIComponent(datasetName);
    return `/projects/${projectId}/entity-lists/${encodedName}/entities/${entityUuid}`;
  };

  const userPath = (id) => `/users/${id}/edit`;

  return {
    projectPath,
    formPath, publishedFormPath, primaryFormPath,
    submissionPath,
    datasetPath,
    entityPath,
    userPath,
    canRoute: canRouteToLocation
  };
});
