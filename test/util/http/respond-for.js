import testData from '../../data';

// The names of the following properties correspond to request keys.
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
  formVersions: () => testData.extendedFormVersions.published(),
  formDraft: () => (testData.extendedFormVersions.last().publishedAt == null
    ? testData.extendedFormDrafts.last()
    : { problem: 404.1 }),
  attachments: () => (testData.extendedFormVersions.last().publishedAt == null
    ? testData.standardFormAttachments.sorted()
    : { problem: 404.1 }),
  submissionsChunk: testData.submissionOData,
  keys: () => testData.standardKeys.sorted(),
  fieldKeys: () => testData.extendedFieldKeys.sorted(),

  backupsConfig: () => (testData.standardBackupsConfigs.size !== 0
    ? testData.standardBackupsConfigs.last()
    : { problem: 404.1 }),
  audits: () => testData.extendedAudits.sorted()
};

// Maps each request key to its corresponding callback. Returns a Map so that
// iteration is guaranteed to be ordered.
const mapKeys = (keys, componentDefaults = undefined) => keys.reduce(
  (map, key) => map.set(
    key,
    componentDefaults != null && componentDefaults[key] != null
      ? componentDefaults[key]
      : defaults[key]
  ),
  new Map()
);

const mapsByComponent = {
  ProjectList: mapKeys(['projects', 'users']),
  ProjectHome: mapKeys(['project']),
  ProjectShow: new Map(),
  ProjectOverview: mapKeys(['forms']),
  ProjectUserList: mapKeys(['roles', 'projectAssignments']),
  FieldKeyList: mapKeys(['fieldKeys']),
  ProjectFormAccess: mapKeys([
    'forms',
    'fieldKeys',
    'roles',
    'formSummaryAssignments'
  ]),
  ProjectSettings: new Map(),
  FormShow: mapKeys(['form', 'formDraft', 'attachments']),
  FormOverview: mapKeys(['formActors']),
  FormVersionList: mapKeys(['formVersions']),
  FormSubmissions: mapKeys(['keys', 'fields', 'submissionsChunk']),
  FormSettings: new Map(),
  FormDraftStatus: mapKeys(['formVersions']),
  FormAttachmentList: new Map(),
  FormDraftTesting: mapKeys(['keys', 'fields', 'submissionsChunk']),
  UserHome: new Map(),
  UserList: mapKeys(['users', 'actors']),
  SystemHome: new Map(),
  BackupList: mapKeys(['backupsConfig', 'audits'], {
    audits: () => testData.standardAudits.sorted()
  }),
  AuditList: mapKeys(['audits'])
};

export default (name) => {
  const map = mapsByComponent[name];
  if (map == null) throw new Error(`unknown component ${name}`);
  return map;
};
