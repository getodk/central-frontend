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
import { odataLiteral } from './odata';

export const queryString = (query) => {
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
const formPath = (suffix) => (projectId, xmlFormId, query = undefined) => {
  const encodedFormId = encodeURIComponent(xmlFormId);
  const qs = queryString(query);
  return `/v1/projects/${projectId}/forms/${encodedFormId}${suffix}${qs}`;
};
const formOrDraftPath = (suffix) =>
  (projectId, xmlFormId, draft = false, query = undefined) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const draftPath = draft ? '/draft' : '';
    const qs = queryString(query);
    return `/v1/projects/${projectId}/forms/${encodedFormId}${draftPath}${suffix}${qs}`;
  };
const submissionPath = (suffix) =>
  (projectId, xmlFormId, instanceId, query = undefined) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedInstanceId = encodeURIComponent(instanceId);
    const qs = queryString(query);
    return `/v1/projects/${projectId}/forms/${encodedFormId}/submissions/${encodedInstanceId}${suffix}${qs}`;
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
  deletedForms: projectPath('/forms?deleted=true'),
  restoreForm: (projectId, numericFormId) =>
    `/v1/projects/${projectId}/forms/${numericFormId}/restore`,
  formSummaryAssignments: (projectId, role) =>
    `/v1/projects/${projectId}/assignments/forms/${role}`,
  form: formPath(''),
  formDatasetDiff: formPath('/dataset-diff'),
  odataSvc: formOrDraftPath('.svc'),
  formActors: (projectId, xmlFormId, role) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    return `/v1/projects/${projectId}/forms/${encodedFormId}/assignments/${role}`;
  },
  fields: formOrDraftPath('/fields'),
  formVersions: formPath('/versions'),
  formVersionDef: (projectId, xmlFormId, version, extension) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedVersion = version !== '' ? encodeURIComponent(version) : '___';
    return `/v1/projects/${projectId}/forms/${encodedFormId}/versions/${encodedVersion}${extension}`;
  },
  formDraft: formPath('/draft'),
  formDraftDatasetDiff: formPath('/draft/dataset-diff'),
  formDraftDef: (projectId, xmlFormId, extension) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    return `/v1/projects/${projectId}/forms/${encodedFormId}/draft${extension}`;
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
  submissions: (projectId, xmlFormId, draft, extension, query = undefined) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const draftPath = draft ? '/draft' : '';
    const qs = queryString(query);
    return `/v1/projects/${projectId}/forms/${encodedFormId}${draftPath}/submissions${extension}${qs}`;
  },
  odataSubmissions: formOrDraftPath('.svc/Submissions'),
  submissionKeys: formOrDraftPath('/submissions/keys'),
  submitters: formOrDraftPath('/submissions/submitters'),
  submission: submissionPath(''),
  odataSubmission: (projectId, xmlFormId, instanceId) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedInstanceId = encodeURIComponent(odataLiteral(instanceId));
    return `/v1/projects/${projectId}/forms/${encodedFormId}.svc/Submissions(${encodedInstanceId})`;
  },
  editSubmission: submissionPath('/edit'),
  submissionAttachment: (projectId, xmlFormId, draft, instanceId, attachmentName) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const draftPath = draft ? '/draft' : '';
    const encodedInstanceId = encodeURIComponent(instanceId);
    const encodedName = encodeURIComponent(attachmentName);
    return `/v1/projects/${projectId}/forms/${encodedFormId}${draftPath}/submissions/${encodedInstanceId}/attachments/${encodedName}`;
  },
  submissionVersionAttachment: (projectId, xmlFormId, instanceId, versionId, attachmentName) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedInstanceId = encodeURIComponent(instanceId);
    const encodedVersionId = encodeURIComponent(versionId);
    const encodedName = encodeURIComponent(attachmentName);
    return `/v1/projects/${projectId}/forms/${encodedFormId}/submissions/${encodedInstanceId}/versions/${encodedVersionId}/attachments/${encodedName}`;
  },
  submissionAudits: submissionPath('/audits'),
  submissionComments: submissionPath('/comments'),
  submissionDiffs: submissionPath('/diffs'),
  submissionVersion: (projectId, xmlFormId, rootId, instanceId) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedRootId = encodeURIComponent(rootId);
    const encodedInstanceId = encodeURIComponent(instanceId);
    return `/v1/projects/${projectId}/forms/${encodedFormId}/submissions/${encodedRootId}/versions/${encodedInstanceId}`;
  },
  publicLinks: formPath('/public-links'),
  datasets: projectPath('/datasets'),
  entities: (projectId, datasetName) => {
    const encodedName = encodeURIComponent(datasetName);
    return `/v1/projects/${projectId}/datasets/${encodedName}/entities.csv`;
  },
  fieldKeys: projectPath('/app-users'),
  serverUrlForFieldKey: (token, projectId) =>
    `/v1/key/${token}/projects/${projectId}`,
  audits: (query) => `/v1/audits${queryString(query)}`
};

export const withAuth = (config, token) => {
  const { headers } = config;
  if ((headers == null || headers.Authorization == null) &&
    config.url.startsWith('/v1/') && token != null) {
    return {
      ...config,
      headers: { ...headers, Authorization: `Bearer ${token}` }
    };
  }
  return config;
};

// Returns `true` if `data` looks like a Backend Problem and `false` if not.
export const isProblem = (data) => data != null && typeof data === 'object' &&
  typeof data.code === 'number' && typeof data.message === 'string';

export const logAxiosError = (logger, error) => {
  if (error.response == null)
    logger.log(error.request != null ? error.request : error.message);
};

// See the `request` mixin for a description of this function's behavior.
export const requestAlertMessage = (i18n, axiosError, problemToAlert = undefined) => {
  // No Problem response
  if (axiosError.request == null) return i18n.t('util.request.noRequest');
  const { response } = axiosError;
  if (response == null) return i18n.t('util.request.noResponse');
  if (!(axiosError.config.url.startsWith('/v1/') && isProblem(response.data)))
    return i18n.t('util.request.errorNotProblem', response);

  const problem = response.data;
  if (problemToAlert != null) {
    const message = problemToAlert(problem);
    return message != null ? message : problem.message;
  }
  return problem.message;
};
