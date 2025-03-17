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
    datasetExists = false,
    hasUpdatedAt = undefined,
    blobExists = datasetExists || hasUpdatedAt != null ? false : inPast
  }) => {
    if (!inPast) {
      if (blobExists)
        throw new Error('blobExists cannot be true for a new form attachment');
      if (datasetExists)
        throw new Error('datasetExists cannot be true for a new form attachment');
      if (hasUpdatedAt === true)
        throw new Error('hasUpdatedAt cannot be true for a new form attachment');
    } else if (blobExists && hasUpdatedAt === false) {
      throw new Error('blobExists and hasUpdatedAt are inconsistent');
    } else if (datasetExists && hasUpdatedAt === false) {
      throw new Error('datasetExists and hasUpdatedAt are inconsistent');
    } else if (blobExists && datasetExists) {
      throw new Error('blobExists and datasetExists cannot both be true');
    }

    return {
      type,
      name,
      blobExists,
      datasetExists,
      exists: blobExists || datasetExists,
      updatedAt: hasUpdatedAt ?? inPast ? fakePastDate([form.createdAt]) : null
    };
  },
  sort: (attachment1, attachment2) =>
    attachment1.name.localeCompare(attachment2.name)
});
