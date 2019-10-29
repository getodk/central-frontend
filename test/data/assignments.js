import { dataStore } from './data-store';
import { standardRoles } from './roles';

// eslint-disable-next-line import/prefer-default-export
export const standardFormSummaryAssignments = dataStore({
  factory: ({ actorId, role, xmlFormId }) => {
    const roleObj = standardRoles.sorted().find(r => r.system === role);
    if (roleObj == null) throw new Error('role not found');
    return { actorId, roleId: roleObj.id, xmlFormId };
  }
});
