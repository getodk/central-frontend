import { dataStore } from './data-store';

// eslint-disable-next-line import/prefer-default-export
export const standardFormSummaryAssignments = dataStore({
  factory: ({ actor, role, form }) =>
    ({ actorId: actor.id, roleId: role.id, xmlFormId: form.xmlFormId })
});
