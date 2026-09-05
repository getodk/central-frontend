const ONCE_KEY_PREFIX = 'odk-once-';

const getKey = (enketoOnceId: string) => ONCE_KEY_PREFIX + enketoOnceId;

export const hasSubmitted = (enketoOnceId: string): boolean => {
  try {
    return !!localStorage.getItem(getKey(enketoOnceId));
  } catch {
    // localStorage not available
    return false;
  }
};

export const setSubmitted = (enketoOnceId: string) => {
  try {
    localStorage.setItem(getKey(enketoOnceId), 'true');
  } catch {
    // localStorage not available
  }
};
