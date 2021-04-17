import faker from 'faker';
import { comparator } from 'ramda';

import { dataStore } from './data-store';
import { extendedForms } from './forms';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';

// eslint-disable-next-line import/prefer-default-export
export const standardPublicLinks = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    form = extendedForms.size !== 0
      ? extendedForms.first()
      : extendedForms.createPast(1).last(),
    displayName = faker.name.findName(),
    once = false,
    token = faker.random.alphaNumeric(64)
  }) => {
    if (extendedUsers.size === 0) throw new Error('user not found');
    const createdBy = extendedUsers.first();

    return {
      id,
      type: 'public_link',
      displayName,
      once,
      token,
      createdAt: inPast
        ? fakePastDate([lastCreatedAt, form.createdAt, createdBy.createdAt])
        : new Date().toISOString(),
      updatedAt: null
    };
  },
  sort: comparator((publicLink1, publicLink2) =>
    (publicLink1.token != null && publicLink2.token == null) ||
    isBefore(publicLink2.createdAt, publicLink1.createdAt))
});
