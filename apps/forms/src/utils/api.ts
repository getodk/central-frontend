export interface Attachment {
  name: string
}

export interface Form {
  name: string;
  xmlFormId: string;
  projectId: number;
  enketoId: string;
  state: string;
  enketoOnceId?: string;
  draft: boolean;
  webformsEnabled: boolean;
  attachments: Attachment[];
  once: boolean;
}

export interface Project {
  verbs: string[];
}

interface BackendStatusResponseBody {
  message: string;
  code: number;
}

interface BackendFormResponseBody {
  name: string;
  xmlFormId: string;
  enketoId: string;
  projectId: number;
  state: string;
  publishedAt: string;
  enketoOnceId: string;
  webformsEnabled: string;
}

interface BackendAttachmentResponseBody {
  name: string;
  exists: boolean;
}

export class RequestError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const queryString = (query:object) => {
  if (query == null) {
    return '';
  }
  const entries = Object.entries(query);
  if (entries.length === 0) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [name, value] of entries) {
    if (Array.isArray(value)) {
      for (const element of value) {
        const val = element === null ? 'null' : (element as string).toString();
        params.append(name, val);
      }
    } else if (value != null) {
      params.set(name, (value as string).toString());
    }
  }
  const qs = params.toString();
  return qs !== '' ? `?${qs}` : qs;
};

export const getSubmissionAttachmentNames = async (projectId: number, formId: string, instanceId: string): Promise<string[]> => {
  const url = `/v1/projects/${projectId}/forms/${formId}/submissions/${instanceId}/attachments`;
  const response = await fetch(url);
  if (!response.ok) {
    const result = await response.json() as BackendStatusResponseBody;
    throw new RequestError(result.message, result.code);
  }
  const attachments = await response.json() as BackendAttachmentResponseBody[];
  return attachments
    .filter(attachment => attachment.exists)
    .map(attachment => attachment.name);
};

export const getFormXml = async (projectId: number, formId: string, draft: boolean, st?: string | null) => {
  const draftPath = draft ? '/draft' : '';
  const qs = queryString({ st });
  const url = `/v1/projects/${projectId}/forms/${formId}${draftPath}.xml${qs}`;
  const response = await fetch(url);
  if (!response.ok) {
    const result = (await response.json()) as BackendStatusResponseBody;
    throw new RequestError(result.message, result.code);
  }
  return await response.text();
};

const getAttachments = async (projectId: number, xmlFormId: string, draft: boolean, st?: string | null): Promise<Attachment[]> => {
  const draftPath = draft ? '/draft' : '';
  const qs = queryString({ st });
  const url = `/v1/projects/${projectId}/forms/${xmlFormId}${draftPath}/attachments${qs}`;
  const response = await fetch(url);
  if (!response.ok) {
    const result = await response.json() as BackendStatusResponseBody;
    throw new RequestError(result.message, result.code);
  }
  const attachments = await response.json() as BackendAttachmentResponseBody[];
  return attachments
    .filter(attachment => attachment.exists)
    .map(attachment => ({ name: attachment.name }))
};

const getForm = async (url: string, draft: boolean, st?: string | null): Promise<Form> => {
  const response = await fetch(url);
  if (!response.ok) {
    const result = await response.json() as BackendStatusResponseBody;
    throw new RequestError(result.message, result.code);
  }
  const result = await response.json() as BackendFormResponseBody;
  const attachments = await getAttachments(result.projectId, result.xmlFormId, draft, st);
  return {
    name: result.name,
    xmlFormId: result.xmlFormId,
    enketoId: result.enketoId,
    projectId: result.projectId,
    state: result.state,
    draft: !result.publishedAt,
    enketoOnceId: result.enketoOnceId,
    webformsEnabled: !!result.webformsEnabled,
    attachments,
    once: false,
  };
};

export const getFormByEnketoId = async (enketoId: string, st?: string | null): Promise<Form> => {
  const qs = queryString({ st });
  const url = `/v1/form-links/${enketoId}/form${qs}`;
  const form = await getForm(url, false, st);
  form.once = enketoId === form.enketoOnceId;
  return form;
};

export const getFormByFormId = async (projectId: number, formId: string, draft: boolean, st?: string | null): Promise<Form> => {
  const draftPath = draft ? '/draft' : '';
  const qs = queryString({ st });
  const url = `/v1/projects/${projectId}/forms/${formId}${draftPath}${qs}`;
  return getForm(url, draft, st);
};

export const getProject = async (projectId: number): Promise<Project> => {
  const qs = queryString({ verbs: true });
  const url = `/v1/projects/${projectId}${qs}`;
  const response = await fetch(url);
  if (!response.ok) {
    const result = await response.json() as BackendStatusResponseBody;
    throw new RequestError(result.message, result.code);
  }
  return await response.json() as Project;
};

interface PostPrimaryInstanceParams {
  form: Form;
  file: File;
  instanceId?: string | null;
  st?: string | null;
  deviceID?: string | null;
};

interface CentralSubmissionResult {
  success: boolean;
  code: number;
  instanceId?: string;
};

interface SubmissionResult {
  success: boolean;
  data: CentralSubmissionResult | Error;
};

export const postPrimaryInstance = async (params: PostPrimaryInstanceParams): Promise<SubmissionResult> => {
  const { form, file, instanceId, st, deviceID } = params;
  const draftPath = form.draft ? '/draft' : '';
  let url: string;
  let method: string;
  if (instanceId) {
    url = `/v1/projects/${form.projectId}/forms/${form.xmlFormId}/submissions/${instanceId}`;
    method = 'PUT';
    url += queryString({ st });
  } else {
    url = `/v1/projects/${form.projectId}/forms/${form.xmlFormId}${draftPath}/submissions`;
    method = 'POST';
    url += queryString({ st, deviceID });
  }
  const headers = {
    'Content-Type': 'text/xml',
    'odk-client': `odk-web-forms/${__WEB_FORMS_VERSION__}`,
    'Accept': 'application/json, text/plain, */*',
    'X-Requested-With': 'XMLHttpRequest'
  };
  try {
    const response = await fetch(url, { body: file, headers, method });
    if (response.status === 413) {
      // payload too large, response from nginx not central, so do not try to json parse the body
      return { success: false, data: { success: false, code: 413 } };
    }
    const data = await response.json() as CentralSubmissionResult;
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, data: error as Error };
  }
};

interface PostAttachmentParams {
  form: Form;
  file: File;
  instanceId: string;
  st?: string | null;
}

interface CentralAttachmentSubmissionResult {
  success: boolean;
  code: number;
};

interface AttachmentSubmissionResult {
  name: string;
  result: {
    success: boolean;
    data: CentralAttachmentSubmissionResult | Error;
  }
};

export const uploadAttachment = async (params: PostAttachmentParams): Promise<AttachmentSubmissionResult> => {
  const { form, file, instanceId, st } = params;
  const draftPath = form.draft ? '/draft' : '';
  const encodedInstanceId = encodeURIComponent(instanceId);
  const encodedName = encodeURIComponent(file.name);
  let url = `/v1/projects/${form.projectId}/forms/${form.xmlFormId}${draftPath}/submissions/${encodedInstanceId}/attachments/${encodedName}`;
  url += queryString({ st });
  const headers = {
    'Content-Type': file.type,
    'X-Requested-With': 'XMLHttpRequest'
  };
  try {
    const response = await fetch(url, { body: file, headers, method: 'POST' });
    if (response.status === 413) {
      // payload too large, response from nginx not central, so do not try to json parse the body
      return { name: file.name, result: { success: false, data: { success: false, code: 413 } } };
    }
    const data = await response.json() as CentralAttachmentSubmissionResult;
    return { name: file.name, result: { success: response.ok, data } };
  } catch (error) {
    return { name: file.name, result: { success: false, data: error as Error } };
  }
};
