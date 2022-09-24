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

/*
Most dynamic imports are housed in this file. Using a dynamic import with
loadAsync() has a couple of benefits:

  - It is possible to check whether the import has been completed.
  - webpack magic comments will not be repeated across files.
*/

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
    /* webpackChunkName: "component-account-claim" */
    '../components/account/claim.vue'
  )))
  .set('AccountEdit', loader(() => import(
    /* webpackChunkName: "component-account-edit" */
    '../components/account/edit.vue'
  )))
  .set('AccountResetPassword', loader(() => import(
    /* webpackChunkName: "component-account-reset-password" */
    '../components/account/reset-password.vue'
  )))
  .set('AnalyticsIntroduction', loader(() => import(
    /* webpackChunkName: "component-analytics-introduction" */
    '../components/analytics/introduction.vue'
  )))
  .set('AnalyticsList', loader(() => import(
    /* webpackChunkName: "component-analytics-list" */
    '../components/analytics/list.vue'
  )))
  .set('AuditList', loader(() => import(
    /* webpackChunkName: "component-audit-list" */
    '../components/audit/list.vue'
  )))
  .set('BackupList', loader(() => import(
    /* webpackChunkName: "component-backup-list" */
    '../components/backup/list.vue'
  )))
  .set('DatasetList', loader(() => import(
    /* webpackChunkName: "component-dataset-list" */
    '../components/dataset/list.vue'
  )))
  .set('Download', loader(() => import(
    /* webpackChunkName: "component-download" */
    '../components/download.vue'
  )))
  .set('FieldKeyList', loader(() => import(
    /* webpackChunkName: "component-field-key-list" */
    '../components/field-key/list.vue'
  )))
  .set('FormAttachmentList', loader(() => import(
    /* webpackChunkName: "component-form-attachment-list" */
    '../components/form-attachment/list.vue'
  )))
  .set('FormDraftStatus', loader(() => import(
    /* webpackChunkName: "component-form-draft-status" */
    '../components/form-draft/status.vue'
  )))
  .set('FormDraftTesting', loader(() => import(
    /* webpackChunkName: "component-form-draft-testing" */
    '../components/form-draft/testing.vue'
  )))
  .set('FormOverview', loader(() => import(
    /* webpackChunkName: "component-form-overview" */
    '../components/form/overview.vue'
  )))
  .set('FormSettings', loader(() => import(
    /* webpackChunkName: "component-form-settings" */
    '../components/form/settings.vue'
  )))
  .set('FormShow', loader(() => import(
    /* webpackChunkName: "component-form-show" */
    '../components/form/show.vue'
  )))
  .set('FormSubmissions', loader(() => import(
    /* webpackChunkName: "component-form-submissions" */
    '../components/form/submissions.vue'
  )))
  .set('FormVersionList', loader(() => import(
    /* webpackChunkName: "component-form-version-list" */
    '../components/form-version/list.vue'
  )))
  .set('FormVersionViewXml', loader(() => import(
    /* webpackChunkName: "component-form-version-view-xml" */
    '../components/form-version/view-xml.vue'
  )))
  .set('Home', loader(() => import(
    /* webpackChunkName: "component-home" */
    '../components/home.vue'
  )))
  .set('HomeConfigSection', loader(() => import(
    /* webpackChunkName: "component-home-config-section" */
    '../components/home/config-section.vue'
  )))
  .set('NotFound', loader(() => import(
    /* webpackChunkName: "component-not-found" */
    '../components/not-found.vue'
  )))
  .set('ProjectFormAccess', loader(() => import(
    /* webpackChunkName: "component-project-form-access" */
    '../components/project/form-access.vue'
  )))
  .set('ProjectOverview', loader(() => import(
    /* webpackChunkName: "component-project-overview" */
    '../components/project/overview.vue'
  )))
  .set('ProjectSettings', loader(() => import(
    /* webpackChunkName: "component-project-settings" */
    '../components/project/settings.vue'
  )))
  .set('ProjectShow', loader(() => import(
    /* webpackChunkName: "component-project-show" */
    '../components/project/show.vue'
  )))
  .set('ProjectUserList', loader(() => import(
    /* webpackChunkName: "component-project-user-list" */
    '../components/project/user/list.vue'
  )))
  .set('PublicLinkList', loader(() => import(
    /* webpackChunkName: "component-public-link-list" */
    '../components/public-link/list.vue'
  )))
  .set('SubmissionShow', loader(() => import(
    /* webpackChunkName: "component-submission-show" */
    '../components/submission/show.vue'
  )))
  .set('SystemHome', loader(() => import(
    /* webpackChunkName: "component-system-home" */
    '../components/system/home.vue'
  )))
  .set('UserEdit', loader(() => import(
    /* webpackChunkName: "component-user-edit" */
    '../components/user/edit.vue'
  )))
  .set('UserHome', loader(() => import(
    /* webpackChunkName: "component-user-home" */
    '../components/user/home.vue'
  )))
  .set('UserList', loader(() => import(
    /* webpackChunkName: "component-user-list" */
    '../components/user/list.vue'
  )));

export const loadAsync = (name) => loaders.get(name).load;
export const loadedAsync = (name) => loaders.get(name).loaded;

// Exported for use in testing
export const setLoader = (name, load) => {
  loaders.set(name, loader(load));
};
