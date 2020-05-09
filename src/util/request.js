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
import Vue from 'vue';

import i18n from '../i18n';
import { tS, teS } from './i18n';

const queryString = (query) => {
  if (query == null) return '';
  const entries = Object.entries(query);
  if (entries.length === 0) return '';
  const params = new URLSearchParams();
  for (const [name, value] of entries)
    if (value != null) params.set(name, value.toString());
  const qs = params.toString();
  return qs !== '' ? `?${qs}` : qs;
};
const projectPath = (suffix) => (id, query = undefined) =>
  `/v1/projects/${id}${suffix}${queryString(query)}`;
const formPath = (suffix, queryDefaults = undefined) =>
  (projectId, xmlFormId, query = undefined) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const combinedQuery = queryDefaults != null
      ? (query != null ? { ...queryDefaults, ...query } : queryDefaults)
      : query;
    const qs = queryString(combinedQuery);
    return `/v1/projects/${projectId}/forms/${encodedFormId}${suffix}${qs}`;
  };
export const apiPaths = {
  // Backend generates session tokens that are URL-safe.
  session: (token) => `/v1/sessions/${token}`,
  users: (query = undefined) => `/v1/users${queryString(query)}`,
  user: (id) => `/v1/users/${id}`,
  password: (id) => `/v1/users/${id}/password`,
  assignment: (role, actorId) => `/v1/assignments/${role}/${actorId}`,
  project: projectPath(''),
  projectAssignments: projectPath('/assignments'),
  projectAssignment: (projectId, role, actorId) =>
    `/v1/projects/${projectId}/assignments/${role}/${actorId}`,
  projectKey: projectPath('/key'),
  forms: projectPath('/forms'),
  formSummaryAssignments: (projectId, role) =>
    `/v1/projects/${projectId}/assignments/forms/${role}`,
  form: formPath(''),
  fields: formPath('/fields', { odata: true }),
  formActors: (projectId, xmlFormId, role) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    return `/v1/projects/${projectId}/forms/${encodedFormId}/assignments/${role}`;
  },
  formVersions: formPath('/versions'),
  formVersionDef: (projectId, xmlFormId, version, extension) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedVersion = version !== '' ? encodeURIComponent(version) : '___';
    return `/v1/projects/${projectId}/forms/${encodedFormId}/versions/${encodedVersion}.${extension}`;
  },
  formDraft: formPath('/draft'),
  formDraftDef: (projectId, xmlFormId, extension) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    return `/v1/projects/${projectId}/forms/${encodedFormId}/draft.${extension}`;
  },
  serverUrlForFormDraft: (token, projectId, xmlFormId) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    return `/v1/test/${token}/projects/${projectId}/forms/${encodedFormId}/draft`;
  },
  publishFormDraft: formPath('/draft/publish'),
  formDraftAttachments: formPath('/draft/attachments'),
  formDraftAttachment: (projectId, xmlFormId, attachmentName) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedName = encodeURIComponent(attachmentName);
    return `/v1/projects/${projectId}/forms/${encodedFormId}/draft/attachments/${encodedName}`;
  },
  fieldKeys: projectPath('/app-users'),
  serverUrlForFieldKey: (token, projectId) =>
    `/v1/key/${token}/projects/${projectId}`,
  audits: (query) => `/v1/audits${queryString(query)}`
};

export const configForPossibleBackendRequest = (config, token) => {
  const { url } = config;
  // If it is not a Backend request, do nothing.
  if (!url.startsWith('/')) return config;
  const result = {
    ...config,
    // Prepend /v1 to the path if necessary.
    url: url.startsWith('/v1/') ? url : `/v1${url}`
  };
  const { headers } = config;
  if (token != null && (headers == null || headers.Authorization == null))
    result.headers = { ...headers, Authorization: `Bearer ${token}` };
  return result;
};

// Returns `true` if `data` looks like a Backend Problem and `false` if not.
export const isProblem = (data) => data != null && typeof data === 'object' &&
  data.code != null && data.message != null;

export const logAxiosError = (error) => {
  const { $logger } = Vue.prototype;
  if (error.response != null)
    $logger.log(error.response.data);
  else if (error.request != null)
    $logger.log(error.request);
  else
    $logger.log('Error', error.message);
};

// See the `request` mixin for a description of this function's behavior.
export const requestAlertMessage = (axiosError, options = {}) => {
  // No Problem response
  if (axiosError.request == null) return i18n.t('util.request.noRequest');
  if (axiosError.response == null) return i18n.t('util.request.noResponse');
  const { data } = axiosError.response;
  if (!isProblem(data)) return i18n.t('util.request.errorNotProblem');

  const problem = data;

  const { problemToAlert } = options;
  if (problemToAlert != null) {
    const message = problemToAlert(problem);
    return message != null ? message : problem.message;
  }

  const { i18nScope } = options;
  if (i18nScope != null) {
    const codeKey = problem.code.toString().replace('.', '_');
    const pathForCode = `${i18nScope}.${codeKey}`;
    if (teS(i18nScope, pathForCode)) return tS(i18nScope, pathForCode, problem);
    const defaultPath = `${i18nScope}.default`;
    if (teS(i18nScope, defaultPath)) return tS(i18nScope, defaultPath, problem);
  }

  return problem.message;
};
