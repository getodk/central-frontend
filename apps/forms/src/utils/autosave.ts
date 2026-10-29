import { get, set, del, keys } from 'idb-keyval';
import type { InstanceSnapshot } from '@getodk/xforms-engine';
import type { Form } from './api';

const EXPIRY_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const KEY_PREFIX = 'autosave-entry';
const OLDEST_ENTRY_KEY = 'autosave-oldest-entry';

const hasExpired = (date: Date) => {
  return (Date.now() - date.getTime()) > EXPIRY_DURATION;
};

const getIdbKey = (form: Form) => {
  return `${KEY_PREFIX}-${form.projectId}-${form.xmlFormId}`;
};

interface AutosaveValue {
  createdOn: Date;
  snapshot: InstanceSnapshot;
};

export const getAutosave = async (form: Form): Promise<InstanceSnapshot | undefined> => {
  const key = getIdbKey(form);
  try {
    const result = (await get(key)) as unknown as AutosaveValue;
    if (!result) {
      return;
    }
    if (hasExpired(result.createdOn)) {
      await deleteAutosave(form);
      return;
    }
    return result.snapshot;
  } catch {
    return;
  }
};

export const setAutosave = async (form: Form, snapshot: InstanceSnapshot): Promise<void> => {
  const key = getIdbKey(form);
  const value: AutosaveValue = {
    createdOn: new Date(),
    snapshot
  };
  try {
    await set(key, value);
  } catch {
    return;
  }
};

export const deleteAutosave = async (form: Form): Promise<void> => {
  const key = getIdbKey(form);
  try {
    return await del(key);
  } catch {
    return;
  }
};

const hasExpiredAutosave = async () => {
  try {
    const oldestAutosave = await get(OLDEST_ENTRY_KEY) as unknown as Date;
    return !oldestAutosave || hasExpired(oldestAutosave);
  } catch {
    return false;
  }
};

const isString = (value: unknown): value is string => {
  return typeof value === 'string';
}

const getAllKeys = async () => {
  try {
    const idbKeys = await keys();
    return idbKeys.filter(key => isString(key) && key.startsWith(KEY_PREFIX));
  } catch {
    return [];
  }
};

export const clearExpiredAutosave = async () => {
  if (!(await hasExpiredAutosave())) {
    return;
  }
  const allKeys = await getAllKeys();
  if (!allKeys.length) {
    return;
  }
  let oldest = new Date();
  for (const key of allKeys) {
    const result = (await get(key)) as unknown as AutosaveValue;
    if (!result) {
      continue;
    }
    if (hasExpired(result.createdOn)) {
      await del(key);
    } else if (result.createdOn.getTime() < oldest.getTime()) {
      oldest = result.createdOn;
    }
  }
  await set(OLDEST_ENTRY_KEY, oldest);
};
