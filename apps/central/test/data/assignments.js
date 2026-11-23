import { omit } from 'ramda';

import { dataStore, view } from './data-store';
import { standardRoles } from './roles';
import { toActor } from './actors';

export const extendedProjectAssignments = dataStore({
  factory: ({ actor, role }) => {
    const roleObj = standardRoles.sorted().find(r => r.system === role);
    if (roleObj == null) throw new Error('role not found');
    return { actor: toActor(actor), roleId: roleObj.id };
  }
});

export const extendedFormSummaryAssignments = dataStore({
  factory: ({ actor, actorId = actor?.id, role, xmlFormId, tokenActive = true }) => {
    const roleObj = standardRoles.sorted().find(r => r.system === role);
    if (roleObj == null) throw new Error('role not found');
    return {
      ...(actor == null ? {} : { actor: toActor(actor) }),
      actorId,
      roleId: roleObj.id,
      xmlFormId,
      tokenActive
    };
  }
});

export const standardFormSummaryAssignments = view(
  extendedFormSummaryAssignments,
  omit(['actor'])
);
