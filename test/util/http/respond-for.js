import testData from '../../data';

const defaults = {
  users: () => testData.standardUsers.sorted(),

  roles: () => testData.standardRoles.sorted(),
  actors: () => testData.standardUsers.sorted().map(testData.toActor),

  projects: () => testData.extendedProjects.sorted(),
  project: () => testData.extendedProjects.last(),
  projectAssignments: () => testData.extendedProjectAssignments.sorted(),
  forms: () => testData.extendedForms.sorted(),
  formSummaryAssignments: () =>
    testData.standardFormSummaryAssignments.sorted(),
  form: () => testData.extendedForms.last(),
  fields: () => testData.extendedForms.last()._fields,
  formActors: () => testData.extendedFieldKeys.sorted().map(testData.toActor),
  formVersions: () => testData.extendedFormVersions.sorted(),
  formDraft: () => (testData.extendedFormVersions.last().publishedAt == null
    ? testData.extendedFormDrafts.last()
    : { problem: 404.1 }),
  attachments: () => (testData.extendedFormVersions.last().publishedAt == null
    ? testData.standardFormAttachments.sorted()
    : { problem: 404.1 }),
  submissionsChunk: testData.submissionOData,
  keys: () => testData.standardKeys.sorted(),
  fieldKeys: () => testData.extendedFieldKeys.sorted()
};

const respond = (keys) => (series, options = undefined) => keys.reduce(
  (acc, key) => {
    if (options != null && key in options) {
      const option = options[key];
      if (option === false) return acc;
      return typeof option === 'number'
        ? acc.respondWithProblem(option)
        : acc.respond(option);
    }
    return acc.respond(defaults[key]);
  },
  series
);

const formShowKeys = ['project', 'form', 'formDraft', 'attachments'];
const submissionListKeys = [
  ...formShowKeys,
  'keys',
  'fields',
  'submissionsChunk'
];

export default {
  ProjectList: respond(['projects', 'users']),
  ProjectOverview: respond(['project', 'forms']),
  ProjectUserList: respond(['project', 'roles', 'projectAssignments']),
  FieldKeyList: respond(['project', 'fieldKeys']),
  ProjectFormAccess: respond([
    'project',
    'forms',
    'fieldKeys',
    'roles',
    'formSummaryAssignments'
  ]),
  ProjectSettings: respond(['project']),
  FormOverview: respond([...formShowKeys, 'formActors']),
  FormVersionList: respond([...formShowKeys, 'formVersions']),
  FormSubmissions: respond(submissionListKeys),
  FormSettings: respond(formShowKeys),
  FormDraftStatus: respond(formShowKeys),
  FormAttachmentList: respond(formShowKeys),
  FormDraftTesting: respond(submissionListKeys),
  UserList: respond(['users', 'actors'])
};
