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
    exists = undefined,
    hasUpdatedAt = undefined
  }) => {
    if (!inPast) {
      if (exists === true)
        throw new Error('inPast and exists are inconsistent');
      if (hasUpdatedAt === true)
        throw new Error('inPast and hasUpdatedAt are inconsistent');
    } else if (exists === true && hasUpdatedAt === false) {
      throw new Error('exists and hasUpdatedAt are inconsistent');
    }

    return {
      type,
      name,
      exists: exists != null
        ? exists
        : (hasUpdatedAt != null ? false : inPast),
      updatedAt: hasUpdatedAt === true || (hasUpdatedAt == null && inPast)
        ? fakePastDate([form.createdAt])
        : null
    };
  },
  sort: (attachment1, attachment2) =>
    attachment1.name.localeCompare(attachment2.name)
});
