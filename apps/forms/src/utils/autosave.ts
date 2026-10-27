import { get, set, del } from 'idb-keyval';
import type { UpdatePayload } from '@getodk/web-forms/lib/types/UpdatePayload.ts';

const EXPIRY_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const hasExpired = (date: Date) => {
  return (Date.now() - date.getTime()) > EXPIRY_DURATION;
};

const getIdbKey = (projectId: number, xmlFormId: string) => {
  return `autosave-${projectId}-${xmlFormId}`;
};

interface AutosaveValue {
  createdAt: Date;
  payload: UpdatePayload;
};

// TODO every page load, delete ALL old autosaves
export const getAutosave = async (projectId: number, xmlFormId: string): Promise<UpdatePayload | undefined> => {
  const key = getIdbKey(projectId, xmlFormId);
  try {
    const result = (await get(key)) as unknown as AutosaveValue;
    if (!result) {
      return;
    }
    if (hasExpired(result.createdAt)) {
      await deleteAutosave(projectId, xmlFormId);
      return;
    }
    return result.payload;
  } catch {
    return;
  }
};

export const setAutosave = async (projectId: number, xmlFormId: string, payload: UpdatePayload): Promise<void> => {
  const key = getIdbKey(projectId, xmlFormId);
  const value: AutosaveValue = {
    createdAt: new Date(),
    payload
  };
  try {
    await set(key, value);
  } catch {
    return;
  }
};

export const deleteAutosave = async (projectId: number, xmlFormId: string): Promise<void> => {
  const key = getIdbKey(projectId, xmlFormId);
  try {
    return await del(key);
  } catch {
    return;
  }
};
