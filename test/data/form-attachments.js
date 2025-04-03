import faker from 'faker';

import { dataStore } from './data-store';
import { extendedForms } from './forms';
import { fakePastDate } from '../util/date-time';

const fileExtensions = {
  image: 'jpg',
  audio: 'mp3',
  video: 'mp4'
};
const fakeName = (type) => {
  const uuid = faker.random.uuid();
  const extension = fileExtensions[type];
  return extension != null ? `${uuid}.${extension}` : uuid;
};

// eslint-disable-next-line import/prefer-default-export
export const standardFormAttachments = dataStore({
  factory: ({
    inPast,
    form = extendedForms.size !== 0
      ? extendedForms.first()
      : extendedForms.createPast(1).last(),
    type = 'image',
    name = fakeName(type),
    hash = undefined,
    datasetExists = false,
    blobExists = hash != null || (inPast && !datasetExists),
    hasUpdatedAt = blobExists
  }) => {
    if (!inPast) {
      if (blobExists)
        throw new Error('blobExists cannot be true for a new form attachment');
      if (hasUpdatedAt === true)
        throw new Error('hasUpdatedAt cannot be true for a new form attachment');
    } else if (blobExists && hasUpdatedAt === false) {
      throw new Error('blobExists and hasUpdatedAt are inconsistent');
    } else if (blobExists && datasetExists) {
      throw new Error('blobExists and datasetExists cannot both be true');
    }

    return {
      type,
      name,
      blobExists,
      datasetExists,
      exists: blobExists || datasetExists,
      hash: hash ?? (blobExists ? 'a'.repeat(32) : null),
      updatedAt: hasUpdatedAt ?? inPast ? fakePastDate([form.createdAt]) : null
    };
  },
  sort: (attachment1, attachment2) =>
    attachment1.name.localeCompare(attachment2.name)
});
