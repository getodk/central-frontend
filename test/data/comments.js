import faker from 'faker';
import { comparator, omit } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';
import { toActor } from './actors';

export const extendedComments = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    body = faker.lorem.sentence(),
    actor = extendedUsers.size !== 0
      ? extendedUsers.first()
      : extendedUsers.createPast(1).last()
  }) => ({
    body,
    actorId: actor.id,
    actor: toActor(actor),
    createdAt: inPast
      ? fakePastDate([lastCreatedAt, actor.createdAt])
      : new Date().toISOString()
  }),
  sort: comparator((comment1, comment2) =>
    isBefore(comment2.createdAt, comment1.createdAt))
});

export const standardComments = view(extendedComments, omit(['actor']));
