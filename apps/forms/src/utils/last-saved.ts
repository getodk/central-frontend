import { get, set, del } from 'idb-keyval';
import type { Form } from './api';

const getIdbKey = (form: Form) => {
  return `last-saved-${form.projectId}-${form.xmlFormId}`;
};

export const getLastSaved = async (form: Form): Promise<string | undefined> => {
  const key = getIdbKey(form);
  try {
    return await get(key);
  } catch {
    return;
  }
};

export const setLastSaved = async (form: Form, file: File): Promise<void> => {
  const key = getIdbKey(form);
  try {
    const xml = await file.text();
    return await set(key, xml);
  } catch {
    return;
  }
};

export const deleteLastSaved = async (form: Form): Promise<void> => {
  const key = getIdbKey(form);
  try {
    return await del(key);
  } catch {
    return;
  }
};
