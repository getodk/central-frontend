import { dataStore } from './data-store';

// eslint-disable-next-line import/prefer-default-export
export const actorProperties = dataStore({
  factory: ({ name }) => ({ name })
});
