/*
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

const loader = (load) => {
  const obj = {
    loaded: false,
    load: async () => {
      const result = await load();
      obj.loaded = true;
      return result;
    }
  };
  return obj;
};

const loaders = new Map()
  .set('FormVersionViewXml', loader(() => import(
    /* webpackChunkName: "component-form-version-view-xml" */
    '../components/form-version/view-xml.vue'
  )))
  .set('ProjectSubmissionOptions', loader(() => import(
    /* webpackChunkName: "component-project-submission-options" */
    '../components/project/submission-options.vue'
  )));

export const loadAsync = (name) => loaders.get(name).load;
export const loadedAsync = (name) => loaders.get(name).loaded;
