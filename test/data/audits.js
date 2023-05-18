import { comparator, omit } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedDatasets } from './datasets';
import { extendedForms } from './forms';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';
import { toActor } from './actors';

const actionsWithDefaultActor = new Set([
  'config.set',
  'entity.create',
  'entity.update.version',
  'submission.create',
  'submission.update',
  'submission.update.version',
  'user.session.create'
]);
const defaultActor = (action) =>
  (actionsWithDefaultActor.has(action) ? extendedUsers.first() : null);

const defaultActee = (action) => {
  if (action === 'entity.create' || action === 'entity.update.version')
    return extendedDatasets.last();
  if (action === 'submission.create' || action === 'submission.update' ||
    action === 'submission.update.version')
    return extendedForms.last();
  if (action === 'user.session.create')
    return extendedUsers.last();
  return null;
};

// An audit object does not have a createdAt property, but it does have a
// loggedAt property, which is similar in some ways. dataStore() tracks the last
// value of createdAt, but not other properties. Given that, we first create a
// store of audit objects with an additional createdAt property, setting
// loggedAt equal to createdAt; then we create a view that omits createdAt.
const auditsWithCreatedAt = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    action,
    actor = defaultActor(action),
    actee = defaultActee(action),
    details = null,
    notes = null,

    loggedAt = undefined
  }) => {
    if (action == null) throw new Error('invalid action');
    const audit = { action };
    if (actor != null) {
      audit.actor = toActor(actor);
      audit.actorId = actor.id;
    }
    if (actee != null) audit.actee = actee;
    audit.details = details;
    audit.notes = notes;
    audit.loggedAt = loggedAt != null
      ? loggedAt
      : (inPast ? fakePastDate([lastCreatedAt]) : new Date().toISOString());
    audit.createdAt = audit.loggedAt;
    return audit;
  },
  sort: comparator((audit1, audit2) =>
    isBefore(audit2.loggedAt, audit1.loggedAt))
});

export const extendedAudits = view(auditsWithCreatedAt, omit(['createdAt']));
export const standardAudits = view(
  auditsWithCreatedAt,
  omit(['actor', 'actee', 'createdAt'])
);
