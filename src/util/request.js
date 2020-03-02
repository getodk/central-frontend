/*
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Vue from 'vue';

const projectPath = (suffix) => (id) => `/v1/projects/${id}${suffix}`;
const formPath = (suffix) => (projectId, xmlFormId) =>
  `/v1/projects/${projectId}/forms/${encodeURIComponent(xmlFormId)}${suffix}`;
export const apiPaths = {
  // Backend generates session tokens that are URL-safe.
  session: (token) => `/v1/sessions/${token}`,
  users: (query = undefined) => {
    const queryString = query != null && query.q != null
      ? `?q=${encodeURIComponent(query.q)}`
      : '';
    return `/v1/users${queryString}`;
  },
  user: (id) => `/v1/users/${id}`,
  password: (id) => `/v1/users/${id}/password`,
  assignment: (role, actorId) => `/v1/assignments/${role}/${actorId}`,
  project: projectPath(''),
  projectAssignments: projectPath('/assignments'),
  projectAssignment: (projectId, role, actorId) =>
    `/v1/projects/${projectId}/assignments/${role}/${actorId}`,
  projectKey: projectPath('/key'),
  forms: (id, query = undefined) => {
    const queryString = query != null && query.ignoreWarnings === true
      ? '?ignoreWarnings=true'
      : '';
    return `/v1/projects/${id}/forms${queryString}`;
  },
  formSummaryAssignments: (projectId, role) =>
    `/v1/projects/${projectId}/assignments/forms/${role}`,
  form: formPath(''),
  formXml: formPath('.xml'),
  schema: formPath('.schema.json?flatten=true&odata=true'),
  oDataSvc: formPath('.svc'),
  formActors: (projectId, xmlFormId, role) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    return `/v1/projects/${projectId}/forms/${encodedFormId}/assignments/${role}`;
  },
  formKeys: formPath('/submissions/keys'),
  formDraft: formPath('/draft'),
  formDraftAttachments: formPath('/draft/attachments'),
  formDraftAttachment: (projectId, xmlFormId, attachmentName) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedName = encodeURIComponent(attachmentName);
    return `/v1/projects/${projectId}/forms/${encodedFormId}/draft/attachments/${encodedName}`;
  },
  submissionsZip: formPath('/submissions.csv.zip'),
  submissionsOData: (projectId, xmlFormId, { top, skip = 0 }) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const queryString = `%24top=${top}&%24skip=${skip}&%24count=true`;
    return `/v1/projects/${projectId}/forms/${encodedFormId}.svc/Submissions?${queryString}`;
  },
  submissionAttachment: (projectId, xmlFormId, instanceId, attachmentName) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedInstanceId = encodeURIComponent(instanceId);
    const encodedName = encodeURIComponent(attachmentName);
    return `/v1/projects/${projectId}/forms/${encodedFormId}/submissions/${encodedInstanceId}/attachments/${encodedName}`;
  },
  fieldKeys: (id) => `/v1/projects/${id}/app-users`,
  audits: ({ action, start = undefined, end = undefined, limit = undefined }) => {
    const startParam = start != null ? `&start=${encodeURIComponent(start)}` : '';
    const endParam = end != null ? `&end=${encodeURIComponent(end)}` : '';
    const limitParam = limit != null ? `&limit=${limit}` : '';
    return `/v1/audits?action=${action}${startParam}${endParam}${limitParam}`;
  }
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

export const requestAlertMessage = (error, problemToAlert) => {
  if (error.request == null)
    return 'Something went wrong: there was no request.';
  if (error.response == null)
    return 'Something went wrong: there was no response to your request.';
  if (!isProblem(error.response.data))
    return 'Something went wrong: the server returned an invalid error.';
  const problem = error.response.data;
  if (problemToAlert == null) return problem.message;
  const message = problemToAlert(problem);
  return message != null ? message : problem.message;
};
