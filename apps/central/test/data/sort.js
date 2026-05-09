// eslint-disable-next-line import/prefer-default-export
export const sortByUpdatedAtOrCreatedAtDesc = (object1, object2) => {
  const time1 = object1.updatedAt != null ? object1.updatedAt : object1.createdAt;
  const time2 = object2.updatedAt != null ? object2.updatedAt : object2.createdAt;
  if (time1 < time2) return 1;
  if (time1 > time2) return -1;
  return 0;
};
