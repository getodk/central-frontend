import faker from '../faker';
import { dataStore } from './data-store';
import { extendedForms } from './forms';

const FORM_ATTACHMENT_TYPES = [
  { type: 'image', fileExtension: 'jpg' },
  { type: 'audio', fileExtension: 'mp3' },
  { type: 'video', fileExtension: 'mp4' }
];

// eslint-disable-next-line import/prefer-default-export
export const extendedFormAttachments = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,
    exists = faker.random.boolean()
  }) => {
    const form = extendedForms.randomOrCreatePast();
    const type = faker.random.arrayElement(FORM_ATTACHMENT_TYPES);
    const { updatedAt } = faker.date.timestamps(inPast, [
      lastCreatedAt,
      form.createdAt
    ]);
    return {
      type,
      name: faker.system.commonFileName(type.fileExtension),
      exists,
      updatedAt
    };
  },
  sort: 'name'
});
