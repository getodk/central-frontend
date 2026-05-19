import { dataStore } from './data-store';

// eslint-disable-next-line import/prefer-default-export
export const standardRoles = dataStore({
  factory: ({
    id,

    name,
    system,
    verbs
  }) => ({
    id,
    name,
    system,
    verbs,
    // Setting to a constant time well in the past, because we currently don't
    // use this value in Frontend.
    createdAt: '2000-01-01T00:00:00.000Z',
    updatedAt: null
  })
});
