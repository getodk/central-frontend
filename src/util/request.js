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

// Returns `true` if `data` looks like a Backend Problem and `false` if not.
export const isProblem = (data) => data != null && typeof data === 'object' &&
  typeof data.code === 'number' && typeof data.message === 'string';



////////////////////////////////////////////////////////////////////////////////
// API PATHS

export const queryString = (query) => {
  if (query == null) return '';
  const entries = Object.entries(query);
  if (entries.length === 0) return '';
  const params = new URLSearchParams();
  for (const [name, value] of entries) {
    if (Array.isArray(value)) {
      for (const element of value)
        params.append(name, element === null ? 'null' : element.toString());
    } else if (value != null) {
      params.set(name, value.toString());
    }
  }
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
const datasetPath = (suffix) =>
  (projectId, datasetName, query = undefined) => {
    const encodedName = encodeURIComponent(datasetName);
    const qs = queryString(query);
    return `/v1/projects/${projectId}/datasets/${encodedName}${suffix}${qs}`;
  };
const entityPath = (suffix) =>
  (projectId, datasetName, uuid, query = undefined) => {
    const encodedDatasetName = encodeURIComponent(datasetName);
    const qs = queryString(query);
    return `/v1/projects/${projectId}/datasets/${encodedDatasetName}/entities/${uuid}${suffix}${qs}`;
  };

export const apiPaths = {
  // Backend generates session tokens that are URL-safe.
  session: (token) => `/v1/sessions/${token}`,
  currentSession: () => '/v1/sessions/current',
  users: (query = undefined) => `/v1/users${queryString(query)}`,
  user: (id) => `/v1/users/${id}`,
  password: (id) => `/v1/users/${id}/password`,
  assignment: (role, actorId) => `/v1/assignments/${role}/${actorId}`,
  userSitePreferences: (k) => `/v1/user-preferences/site/${k}`,
  userProjectPreferences: (projectId, k) => `/v1/user-preferences/project/${projectId}/${k}`,
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
  formXml: formOrDraftPath('.xml'),
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
  formByEnketoId: (enketoId, query = undefined) => `/v1/form-links/${enketoId}/form${queryString(query)}`,
  serverUrlForFormDraft: (token, projectId, xmlFormId) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    return `/v1/test/${token}/projects/${projectId}/forms/${encodedFormId}/draft`;
  },
  publishFormDraft: formPath('/draft/publish'),
  publishedAttachments: formPath('/attachments'),
  formDraftAttachments: formPath('/draft/attachments'),
  formAttachment: (projectId, xmlFormId, draft, attachmentName) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedName = encodeURIComponent(attachmentName);
    const draftPath = draft ? '/draft' : '';
    return `/v1/projects/${projectId}/forms/${encodedFormId}${draftPath}/attachments/${encodedName}`;
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
  restoreSubmission: submissionPath('/restore'),
  odataSubmission: (projectId, xmlFormId, instanceId, query = undefined) => {
    const encodedFormId = encodeURIComponent(xmlFormId);
    const encodedInstanceId = encodeURIComponent(odataLiteral(instanceId));
    const qs = queryString(query);
    return `/v1/projects/${projectId}/forms/${encodedFormId}.svc/Submissions(${encodedInstanceId})${qs}`;
  },
  editSubmission: submissionPath('/edit'),
  submissionAttachments: submissionPath('/attachments'),
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
  submissionXml: submissionPath('.xml'),
  publicLinks: formPath('/public-links'),
  datasets: projectPath('/datasets'),
  dataset: datasetPath(''),
  datasetProperties: datasetPath('/properties'),
  entityCreators: datasetPath('/entities/creators'),
  entities: (projectId, datasetName, suffix = '', query = undefined) => {
    const encodedName = encodeURIComponent(datasetName);
    const qs = queryString(query);
    return `/v1/projects/${projectId}/datasets/${encodedName}/entities${suffix}${qs}`;
  },
  odataEntitiesSvc: datasetPath('.svc'),
  odataEntities: datasetPath('.svc/Entities'),
  entity: entityPath(''),
  entityAudits: entityPath('/audits'),
  entityVersions: entityPath('/versions'),
  entityRestore: entityPath('/restore'),
  fieldKeys: projectPath('/app-users'),
  serverUrlForFieldKey: (token, projectId) =>
    `/v1/key/${token}/projects/${projectId}`,
  audits: (query) => `/v1/audits${queryString(query)}`,
};



////////////////////////////////////////////////////////////////////////////////
// SENDING REQUESTS

const httpMethods = {};
for (const prop of ['get', 'delete']) {
  const method = prop.toUpperCase();
  // eslint-disable-next-line func-names
  httpMethods[prop] = function(url, config = undefined) {
    return this({ ...config, method, url });
  };
}
for (const prop of ['post', 'put', 'patch']) {
  const method = prop.toUpperCase();
  // eslint-disable-next-line func-names
  httpMethods[prop] = function(url, data = undefined, config = undefined) {
    const full = { ...config, method, url };
    if (data != null) full.data = data;
    return this(full);
  };
}

// Adds convenience methods for HTTP verbs to a request() function. `this`
// cannot be passed through to the convenience methods, so if the request()
// function references `this`, you must bind `this` for it first.
export const withHttpMethods = (f) => Object.assign(f, httpMethods);


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
  if (!(axiosError.config.url.startsWith('/v1/') && isProblem(response.data))) {
    if (response.status === 413)
      return i18n.t('mixin.request.alert.entityTooLarge');
    return i18n.t('util.request.errorNotProblem', response);
  }

  const problem = response.data;
  if (problemToAlert != null) {
    const message = problemToAlert(problem);
    if (message != null) return message;
  }
  if (problem.code === 404.1) return i18n.t('util.request.problem.404_1');
  if (problem.code === 409.17) {
    const { duplicateProperties } = problem.details;
    // eslint-disable-next-line prefer-template
    return i18n.tc('util.request.problem.409_17.message', duplicateProperties.length) +
      '\n\n' +
      duplicateProperties
        .map(p => `• ${i18n.t('util.request.problem.409_17.duplicateProperty', p)}`)
        .join('\n');
  }
  return problem.message;
};
