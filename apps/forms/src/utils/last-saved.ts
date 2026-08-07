import { get, set, del } from 'idb-keyval';

const getIdbKey = (projectId: number, xmlFormId: string) => {
  return `last-saved-${projectId}-${xmlFormId}`;
};

export const getLastSaved = async (projectId: number, xmlFormId: string): Promise<string | undefined> => {
  const key = getIdbKey(projectId, xmlFormId);
  try {
    return await get(key);
  } catch {
    return;
  }
};

export const setLastSaved = async (projectId: number, xmlFormId: string, file: File): Promise<void> => {
  const key = getIdbKey(projectId, xmlFormId);
  try {
    const xml = await file.text();
    return await set(key, xml);
  } catch {
    return;
  }
};

export const deleteLastSaved = async (projectId: number, xmlFormId: string): Promise<void> => {
  const key = getIdbKey(projectId, xmlFormId);
  try {
    return await del(key);
  } catch {
    return;
  }
};
