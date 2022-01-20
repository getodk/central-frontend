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
import { identity } from 'ramda';

import { noop } from './util';

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
  formSummaryAssignments: (projectId, role) =>
    `/v1/projects/${projectId}/assignments/forms/${role}`,
  form: formPath(''),
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
    const encodedInstanceId = encodeURIComponent(instanceId.replaceAll("'", "''"));
    return `/v1/projects/${projectId}/forms/${encodedFormId}.svc/Submissions('${encodedInstanceId}')`;
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
  publicLinks: formPath('/public-links'),
  fieldKeys: projectPath('/app-users'),
  serverUrlForFieldKey: (token, projectId) =>
    `/v1/key/${token}/projects/${projectId}`,
  audits: (query) => `/v1/audits${queryString(query)}`
};

export const chainSignals = (signal, abortController) => {
  if (signal.aborted)
    abortController.abort();
  else
    signal.addEventListener('abort', () => { abortController.abort(); });
};

// Returns `true` if `data` looks like a Backend Problem and `false` if not.
export const isProblem = (data) => data != null && typeof data === 'object' &&
  typeof data.code === 'number' && typeof data.message === 'string';



////////////////////////////////////////////////////////////////////////////////
// request()

const requestAlertMessage = (i18n, error, problemToAlert) => {
  // No Problem response
  if (error.request == null) return i18n.t('util.request.noRequest');
  const { response } = error;
  if (response == null) return i18n.t('util.request.noResponse');
  if (!(error.config.url.startsWith('/v1/') && isProblem(response.data)))
    return i18n.t('util.request.errorNotProblem', response);

  const problem = response.data;

  if (problemToAlert != null) {
    const message = problemToAlert(problem);
    return message != null ? message : problem.message;
  }

  const key = problem.code.toString().replace('.', '_');
  const path = `problem.${key}`;
  if (i18n.te(path, i18n.fallbackLocale)) return i18n.t(path, problem);

  return problem.message;
};

/*
The request() function sends a request. If the request is to Backend, request()
will automatically specify the Authorization header. request() calls axios and
accepts all axios options. It also accepts the following options:

  - extended (default: false). `true` to request extended metadata and `false`
    not to.
  - abortAfterNavigate (default: false). It is often the case that a request
    should be aborted after the user navigates away from the route that sent the
    request. Specifying `true` will abort the request in that case; specifying
    `false` will not. If a request is aborted, then if/when a response is
    received for the request, it will be ignored.

  Error Handling
  --------------

  - fulfillProblem (optional). Usually, an error response means that the request
    was invalid or that something went wrong. However, in some cases, an error
    response should be treated as if it is successful, resulting in a fulfilled,
    not a rejected, promise. Use fulfillProblem to identify such responses.
    fulfillProblem is a function that will be passed the Backend Problem. (Any
    error response that is not a Problem is automatically considered
    unsuccessful.) fulfillProblem should return `true` if the response is
    considered successful and `false` if not.
  - alert (default: true). Specify `true` to show an alert for an unsuccessful
    response and to log it. Specify `false` to not inform the user of an
    unsuccessful response.

  - problemToAlert (optional). If the request results in an unsuccessful
    response, the request() function shows an alert. By default, the alert
    message is the same as that of the Backend Problem. However, there are two
    ways to show a different message:

    1. If a function is specified for problemToAlert, request() passes the
       Problem to the function, which has the option to return a different
       message. If the function returns `null` or `undefined`, the Problem's
       message is used.
    2. If problemToAlert has not been specified, and a component's i18n object
       has been passed to request(), request() will check whether the component
       has specified a message for the Problem code. For example:

       <i18n lang="json5">
       {
         "en": {
           "problem": {
             "404_1": "Not found."
           }
         }
       }
       </i18n>

  - errorToAlert (optional). When the request results in a unsuccessful
    response that is a Problem, problemToAlert provides a way to customize the
    alert message. errorToAlert provides a way to customize the alert message
    for an unsuccessful response that is not a Problem. errorToAlert is a
    function that receives the message that the alert would show. The alert will
    instead show the message that errorToAlert returns.
  - onError (optional). A callback that is run if the request is aborted or
    results in an unsuccessful response.

Calling catch()
---------------

The request() function returns a promise. If you call catch() on the promise,
make sure that the logic of the catch() callback accounts for whether the
request may have been aborted. A request may be aborted if `true` is specified
for abortAfterNavigate or if the `signal` option from axios is specified.
*/
export const request = (container, ...args) => {
  const [i18n, config] = args.length >= 2 ? args : [container.i18n, args[0]];
  if (typeof config === 'string')
    return request(container, i18n, { url: config });
  const {
    extended = false,
    abortAfterNavigate = false,
    fulfillProblem = undefined,
    alert: alertOption = true,
    problemToAlert = undefined,
    errorToAlert = identity,
    onError = noop,
    ...axiosConfig
  } = config;

  const { router, requestData, alert, http, logger } = container;
  // This limit is set in the nginx config. The alert also mentions this number.
  if (axiosConfig.data != null && axiosConfig.data instanceof File &&
    axiosConfig.data.size > 100000000) {
    alert.danger(i18n.t('mixin.request.alert.fileSize', axiosConfig.data));
    return Promise.reject(new Error('file size exceeds limit'));
  }

  const headers = { ...axiosConfig.headers };
  if (headers.Authorization == null && axiosConfig.url.startsWith('/v1/') &&
    requestData.session.data != null)
    headers.Authorization = `Bearer ${requestData.session.data.token}`;
  if (extended) headers['X-Extended-Metadata'] = true;
  axiosConfig.headers = headers;

  const abortController = new AbortController();
  const removeHook = abortAfterNavigate
    ? router.afterEach(() => { abortController.abort(); })
    : noop;
  abortController.signal.addEventListener('abort', () => {
    removeHook();
    onError();
  });
  if (axiosConfig.signal != null)
    chainSignals(axiosConfig.signal, abortController);
  axiosConfig.signal = abortController.signal;

  return http.request(axiosConfig)
    .catch(error => {
      if (abortController.signal.aborted) throw error;

      if (fulfillProblem != null && error.response != null &&
        isProblem(error.response.data) && fulfillProblem(error.response.data))
        return error.response;

      if (alertOption) {
        if (error.response == null)
          logger.log(error.request != null ? error.request : error.message);
        alert.danger(errorToAlert(requestAlertMessage(i18n, error, problemToAlert)));
      }

      onError();
      throw error;
    })
    // Remove the navigation hook.
    .finally(() => { abortController.abort(); });
};
