import faker from '../faker';
import { dataStore } from './data-store';
import { extendedForms } from './forms';

const TYPES = {
  image: 'jpg',
  audio: 'mp3',
  video: 'mp4'
};

// eslint-disable-next-line import/prefer-default-export
export const extendedFormAttachments = dataStore({
  factory: ({
    inPast,
    type = faker.random.arrayElement(Object.keys(TYPES)),
    // Adding a UUID to help ensure uniqueness.
    name = `${faker.random.words()} ${faker.random.uuid()}${TYPES[type]}`,
    ...options
  }) => {
    if (!inPast && options.exists === true)
      throw new Error('inPast and exists are inconsistent');
    if (options.hasUpdatedAt != null) {
      if (!inPast && options.hasUpdatedAt)
        throw new Error('inPast and hasUpdatedAt are inconsistent');
      if (options.exists === true && !options.hasUpdatedAt)
        throw new Error('exists and hasUpdatedAt are inconsistent');
      if (options.exists == null) {
        // eslint-disable-next-line no-param-reassign
        options.exists = options.hasUpdatedAt ? faker.random.boolean() : false;
      }
    } else {
      if (options.exists == null) {
        // eslint-disable-next-line no-param-reassign
        options.exists = inPast && faker.random.boolean();
      }
      // eslint-disable-next-line no-param-reassign
      options.hasUpdatedAt = inPast && (options.exists || faker.random.boolean());
    }
    const { exists, hasUpdatedAt } = options;
    const form = extendedForms.randomOrCreatePast();
    const updatedAt = hasUpdatedAt
      ? faker.date.pastSince(form.createdAt).toISOString()
      : null;
    return { type, name, exists, updatedAt };
  },
  sort: (attachment1, attachment2) =>
    attachment1.name.localeCompare(attachment2.name)
});
