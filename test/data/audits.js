import { comparator, omit } from 'ramda';

import faker from '../faker';
import { dataStore, view } from './data-store';
import { toActor } from './actors';

// An audit object does not have a createdAt property, but it does have a
// loggedAt property, which is similar in some ways. dataStore() tracks the last
// value of createdAt, but not other properties. Given that, we first create a
// store of audit objects with an additional createdAt property, setting
// loggedAt equal to createdAt; then we create a view that omits createdAt.
const auditsWithCreatedAt = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    // I'm not going to try to mock these properties.
    actor = undefined,
    action = undefined,
    actee = undefined,
    details = undefined,

    loggedAt = undefined
  }) => {
    if (!inPast) throw new Error('inPast must be true');
    if (action == null) throw new Error('invalid action');
    const audit = { action };
    if (actor != null) {
      audit.actor = toActor(actor);
      audit.actorId = actor.id;
    }
    if (actee != null) {
      audit.actee = actee;
      audit.acteeId = actee.id;
    }
    if (details != null) audit.details = details;
    if (loggedAt != null) {
      if (loggedAt < lastCreatedAt) throw new Error('invalid loggedAt');
      audit.loggedAt = loggedAt;
    } else {
      audit.loggedAt = faker.date.pastSince(lastCreatedAt).toISOString();
    }
    audit.createdAt = audit.loggedAt;
    return audit;
  },
  sort: comparator((audit1, audit2) => audit1.loggedAt > audit2.loggedAt)
});

// eslint-disable-next-line import/prefer-default-export
export const extendedAudits = view(auditsWithCreatedAt, omit(['createdAt']));
