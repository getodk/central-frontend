import R from 'ramda';

// eslint-disable-next-line import/prefer-default-export
export const toActor = R.pick(['id', 'displayName', 'createdAt', 'updatedAt']);
