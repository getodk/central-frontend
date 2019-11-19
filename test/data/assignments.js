import { dataStore } from './data-store';
import { standardRoles } from './roles';
import { toActor } from './actors';

export const extendedProjectAssignments = dataStore({
  factory: ({ actor, role }) => {
    const roleObj = standardRoles.sorted().find(r => r.system === role);
    if (roleObj == null) throw new Error('role not found');
    return { actor: toActor(actor), roleId: roleObj.id };
  }
});

export const standardFormSummaryAssignments = dataStore({
  factory: ({ actorId, role, xmlFormId }) => {
    const roleObj = standardRoles.sorted().find(r => r.system === role);
    if (roleObj == null) throw new Error('role not found');
    return { actorId, roleId: roleObj.id, xmlFormId };
  }
});
