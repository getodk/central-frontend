import faker from '../faker';
import { dataStore } from './data-store';

// eslint-disable-next-line import/prefer-default-export
export const extendedProjects = dataStore({
  factory: ({ id, name = faker.name.findName() }) => ({ id, name })
});
