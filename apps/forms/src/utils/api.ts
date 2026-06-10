export interface Form {
  xmlFormId: string;
  projectId: number;
  enketoId: string;
  state: string;
  enketoOnceId?: string;
  draft: boolean;
  webformsEnabled: boolean;
};

export interface Project {
  verbs: string[];
};

interface BackendStatusResponseBody {
  message: string;
  code: number;
}

interface BackendFormResponseBody {
  xmlFormId: string;
  enketoId: string;
  projectId: number;
  state: string;
  publishedAt: string;
  enketoOnceId: string;
  webformsEnabled: string;
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

const getForm = async (url: string): Promise<Form> => {
  const response = await fetch(url);
  if (!response.ok) {
    const result = await response.json() as BackendStatusResponseBody;
    throw new RequestError(result.message, result.code);
  }
  const result = await response.json() as BackendFormResponseBody;
  return {
    xmlFormId: result.xmlFormId,
    enketoId: result.enketoId,
    projectId: result.projectId,
    state: result.state,
    draft: !result.publishedAt,
    enketoOnceId: result.enketoOnceId,
    webformsEnabled: !!result.webformsEnabled
  };
};

export const getFormByEnketoId = async (enketoId: string, st?: string | null): Promise<Form> => {
  const qs = queryString({ st });
  const url = `/v1/form-links/${enketoId}/form${qs}`;
  return getForm(url);
};

export const getFormByFormId = async (projectId: number, formId: string, draft: boolean, st?: string | null): Promise<Form> => {
  const draftPath = draft ? '/draft' : '';
  const qs = queryString({ st });
  const url = `/v1/projects/${projectId}/forms/${formId}${draftPath}${qs}`;
  return getForm(url);
};

export const getProject = async (projectId: number): Promise<Project> => {
  const url = `/v1/projects/${projectId}`;
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Extended-Metadata': 'true'
  });
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const result = await response.json() as BackendStatusResponseBody;
    throw new RequestError(result.message, result.code);
  }
  return await response.json() as Project;
};
