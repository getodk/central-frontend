export type Form = {
  xmlFormId: string;
  projectId: number;
  enketoId: string;
  state: string;
  enketoOnceId?: string;
  draft: boolean;
  webformsEnabled: boolean;
};

export type Project = {
  verbs: string[]
};

export const queryString = (query:any) => {
  if (query == null) return '';
  const entries = Object.entries(query);
  if (entries.length === 0) return '';
  const params = new URLSearchParams();
  for (const [name, value] of entries) {
    if (Array.isArray(value)) {
      for (const element of value) {
        params.append(name, element === null ? 'null' : element.toString());
      }
    } else if (value != null) {
      params.set(name, value.toString());
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
    // TODO handle gracefully
    throw new Error('failed to fetch form');
  }
  return await response.text();
};

const getForm = async (url: string): Promise<Form> => {
  const response = await fetch(url);
  if (!response.ok) {
    // TODO handle gracefully
    throw new Error('failed to fetch form');
  }
  const config = await response.json();
  return {
    xmlFormId: config.xmlFormId,
    enketoId: config.enketoId,
    projectId: config.projectId,
    state: config.state,
    draft: !config.publishedAt,
    enketoOnceId: config.enketoOnceId,
    webformsEnabled: !!config.webformsEnabled
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
    // TODO handle gracefully
    throw new Error('failed to fetch form');
  }
  return await response.json();
};
