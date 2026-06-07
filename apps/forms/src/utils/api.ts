export type Form = {
  xmlFormId: string;
  projectId: number;
  enketoId: string;
  enketoOnceId?: string;
  draft: boolean;
  webformsEnabled: boolean;
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

export const getFormConfig = async (projectId: number, formId: string, enketoId: string | null, draft: boolean, st?: string | null): Promise<Form> => {
  const draftPath = draft ? '/draft' : '';
  const qs = queryString({ st });

  let url:string;
  if (enketoId) {
    url = `/v1/form-links/${enketoId}/form${qs}`;
  } else {
    url = `/v1/projects/${projectId}/forms/${formId}${draftPath}${qs}`;
  }

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
    draft: !config.publishedAt,
    enketoOnceId: config.enketoOnceId,
    webformsEnabled: !!config.webformsEnabled
  };
};