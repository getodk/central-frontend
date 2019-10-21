import { dataStore } from './data-store';
import { standardRoles } from './roles';

// eslint-disable-next-line import/prefer-default-export
export const standardFormSummaryAssignments = dataStore({
  factory: ({ actor, role, form }) => {
    const roleObj = standardRoles.sorted().find(r => r.system === role);
    if (roleObj == null) throw new Error('role not found');
    return { actorId: actor.id, roleId: roleObj.id, xmlFormId: form.xmlFormId };
  }
});
