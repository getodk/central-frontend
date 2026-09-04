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

// Most dynamic imports are housed in this file. Using a dynamic import with
// loadAsync() has the benefit that it is possible to check whether the import
// has been completed. Use loadedAsync() to check the status of an import.

const loader = (load) => {
  const obj = {
    loaded: false,
    load: async () => {
      const m = await load();
      obj.loaded = true;
      return m;
    }
  };
  return obj;
};

const loaders = new Map()
  .set('AccountClaim', loader(() => import(
    '../components/account/claim.vue'
  )))
  .set('AccountEdit', loader(() => import(
    '../components/account/edit.vue'
  )))
  .set('AccountResetPassword', loader(() => import(
    '../components/account/reset-password.vue'
  )))
  .set('AnalyticsIntroduction', loader(() => import(
    '../components/analytics/introduction.vue'
  )))
  .set('AnalyticsList', loader(() => import(
    '../components/analytics/list.vue'
  )))
  .set('AuditList', loader(() => import(
    '../components/audit/list.vue'
  )))
  .set('ClientConfigError', loader(() => import(
    '../components/client-config-error.vue'
  )))
  .set('ConfigLogin', loader(() => import(
    '../components/config/login.vue'
  )))
  .set('DatasetList', loader(() => import(
    '../components/dataset/list.vue'
  )))
  .set('DatasetShow', loader(() => import(
    '../components/dataset/show.vue'
  )))
  .set('DatasetOverview', loader(() => import(
    '../components/dataset/overview.vue'
  )))
  .set('DatasetEntities', loader(() => import(
    '../components/dataset/entities.vue'
  )))
  .set('DatasetSettings', loader(() => import(
    '../components/dataset/settings.vue'
  )))
  .set('Download', loader(() => import(
    '../components/download.vue'
  )))
  .set('EntityBranchData', loader(() => import(
    '../components/entity/branch-data.vue'
  )))
  .set('EntityShow', loader(() => import(
    '../components/entity/show.vue'
  )))
  .set('EntityUpload', loader(() => import(
    '../components/entity/upload.vue'
  )))
  .set('FeedbackButton', loader(() => import(
    '../components/feedback-button.vue'
  )))
  .set('FieldKeyList', loader(() => import(
    '../components/field-key/list.vue'
  )))
  .set('FormEdit', loader(() => import(
    '../components/form/edit.vue'
  )))
  .set('FormNewPage', loader(() => import(
    '../components/form/new-page.vue'
  )))
  .set('FormSettings', loader(() => import(
    '../components/form/settings.vue'
  )))
  .set('FormShow', loader(() => import(
    '../components/form/show.vue'
  )))
  .set('FormSubmissions', loader(() => import(
    '../components/form/submissions.vue'
  )))
  .set('GeojsonMap', loader(() => import(
    '../components/geojson-map.vue'
  )))
  .set('FormVersionList', loader(() => import(
    '../components/form-version/list.vue'
  )))
  .set('XmlViewer', loader(() => import(
    '../components/xml-viewer.vue'
  )))
  .set('GeojsonMapDevTools', loader(() => import(
    '../components/geojson-map/dev-tools.vue'
  )))
  .set('Home', loader(() => import(
    '../components/home.vue'
  )))
  .set('HomeConfigSection', loader(() => import(
    '../components/home/config-section.vue'
  )))
  .set('HoverCards', loader(() => import(
    '../components/hover-cards.vue'
  )))
  .set('NotFound', loader(() => import(
    '../components/not-found.vue'
  )))
  .set('OutdatedVersion', loader(() => import(
    '../components/outdated-version.vue'
  )))
  .set('ProjectFormAccess', loader(() => import(
    '../components/project/form-access.vue'
  )))
  .set('ProjectOverview', loader(() => import(
    '../components/project/overview.vue'
  )))
  .set('ProjectSettings', loader(() => import(
    '../components/project/settings.vue'
  )))
  .set('ProjectShow', loader(() => import(
    '../components/project/show.vue'
  )))
  .set('ProjectUserList', loader(() => import(
    '../components/project/user/list.vue'
  )))
  .set('CustomPropertyList', loader(() => import(
    '../components/project/custom-properties/list.vue'
  )))
  .set('PublicLinkList', loader(() => import(
    '../components/public-link/list.vue'
  )))
  .set('SubmissionShow', loader(() => import(
    '../components/submission/show.vue'
  )))
  .set('SystemHome', loader(() => import(
    '../components/system/home.vue'
  )))
  .set('UserEdit', loader(() => import(
    '../components/user/edit.vue'
  )))
  .set('UserHome', loader(() => import(
    '../components/user/home.vue'
  )))
  .set('UserList', loader(() => import(
    '../components/user/list.vue'
  )));

export const loadAsync = (name) => loaders.get(name).load;
export const loadedAsync = (name) => loaders.get(name).loaded;

// Exported for use in testing
export const setLoader = (name, load) => {
  loaders.set(name, loader(load));
};
