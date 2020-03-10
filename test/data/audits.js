import { comparator, omit } from 'ramda';

import { dataStore, view } from './data-store';
import { fakePastDate, isBefore } from '../util/date-time';
import { standardBackupsConfigs } from './backups-configs';
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
    audit.loggedAt = loggedAt != null
      ? loggedAt
      : fakePastDate([lastCreatedAt]);
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

function createBackupAudit({ success, configSetAt = undefined, loggedAt }) {
  const details = { success };
  if (success) {
    if (configSetAt != null)
      details.configSetAt = configSetAt;
    else if (standardBackupsConfigs.size === 1)
      details.configSetAt = standardBackupsConfigs.last().setAt;
    else
      throw new Error('backups config not found');
  } else {
    const error = new Error('error');
    details.stack = error.stack;
    details.message = error.message;
  }
  if (loggedAt == null || isBefore(loggedAt, details.configSetAt))
    throw new Error('invalid loggedAt');
  auditsWithCreatedAt.createPast(1, {
    actor: null,
    action: 'backup',
    actee: null,
    details,
    loggedAt
  });
  return this;
}

extendedAudits.createBackupAudit = createBackupAudit;
standardAudits.createBackupAudit = createBackupAudit;
