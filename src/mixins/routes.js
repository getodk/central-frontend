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

/*
This mixin includes methods related to the router.

The mixin factory does not take any options.
*/

import { canRoute } from '../util/router';

const _projectPath = (id, suffix = '') => {
  const slash = suffix !== '' ? '/' : '';
  return `/projects/${id}${slash}${suffix}`;
};
const _formPath = (projectId, xmlFormId, suffix = '') => {
  const encodedFormId = encodeURIComponent(xmlFormId);
  const slash = suffix !== '' ? '/' : '';
  return `/projects/${projectId}/forms/${encodedFormId}${slash}${suffix}`;
};

// @vue/component
const mixin = {
  inject: ['container'],
  methods: {
    /*
    Returns a path to a project page. Do not use projectPath() for Backend
    paths: use apiPaths instead.

    Examples:

    projectPath(1, 'app-users')  // '/projects/1/app-users'
    projectPath(1)               // '/projects/1'

    If the project id is not specified, it is inferred from this.$route.params:

    projectPath('app-users')
    projectPath()
    */
    projectPath(idOrSuffix, suffix) {
      return suffix != null || typeof idOrSuffix === 'number'
        ? _projectPath(idOrSuffix, suffix)
        : _projectPath(this.$route.params.projectId, idOrSuffix);
    },
    /*
    Returns a path to a form page. Do not use formPath() for Backend paths: use
    apiPaths instead.

    Examples:

    formPath(1, 'f', 'submissions')  // '/projects/1/forms/f/submissions'
    formPath(1, 'f')                 // '/projects/1/forms/f'

    If projectId and xmlFormId are not specified, they are inferred from
    this.$route.params:

    formPath('submissions')
    formPath()
    */
    formPath(projectIdOrSuffix, xmlFormId, suffix) {
      if (xmlFormId == null) {
        const { params } = this.$route;
        return _formPath(params.projectId, params.xmlFormId, projectIdOrSuffix);
      }
      return _formPath(projectIdOrSuffix, xmlFormId, suffix);
    },
    // Returns the path to the primary page for a form. This changes based on
    // the current user's role, as well as whether the form has a published
    // version.
    primaryFormPath(form) {
      if (form.publishedAt != null) {
        const path = this.formPath(form.projectId, form.xmlFormId);
        // A project viewer can't navigate to the form overview, but anyone who
        // can navigate to the form should be able to navigate to
        // .../submissions.
        return this.canRoute(path) ? path : `${path}/submissions`;
      } else { // eslint-disable-line no-else-return
        const path = this.formPath(form.projectId, form.xmlFormId, 'draft');
        return this.canRoute(path) ? path : `${path}/testing`;
      }
    },
    userPath(id) {
      return `/users/${id}/edit`;
    },
    canRoute(location) {
      const { requestData } = this.container;
      return canRoute(this.$router.resolve(location), this.$route, requestData);
    }
  }
};

export default () => mixin;
