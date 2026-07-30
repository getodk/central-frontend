import { get, set } from 'idb-keyval';

const getIdbKey = (projectId: number, xmlFormId: string) => {
  return `last-saved-${projectId}-${xmlFormId}`;
};

export const getLastSaved = async (projectId: number, xmlFormId: string): Promise<string | undefined> => {
  const key = getIdbKey(projectId, xmlFormId);
  return await get(key);
};

export const setLastSaved = async (projectId: number, xmlFormId: string, file: File): Promise<void> => {
  // TODO need to skip over encrypted submissions
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const xml = e.target?.result;
      if (!xml) {
        resolve();
      } else {
        const key = getIdbKey(projectId, xmlFormId);
        set(key, xml).then(() => resolve());
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
