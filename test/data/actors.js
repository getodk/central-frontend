import { pick } from 'ramda';

// eslint-disable-next-line import/prefer-default-export
export const toActor = pick(['id', 'type', 'displayName', 'createdAt', 'updatedAt', 'deletedAt']);
