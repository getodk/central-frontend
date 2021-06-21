import testData from '../../data';

// The names of the following properties correspond to request keys.
const defaults = {
  users: () => testData.standardUsers.sorted(),
  user: () => testData.standardUsers.last(),

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
  formVersions: () => testData.extendedFormVersions.published(),
  formDraft: () => (testData.extendedFormVersions.last().publishedAt == null
    ? testData.extendedFormDrafts.last()
    : { problem: 404.1 }),
  attachments: () => (testData.extendedFormVersions.last().publishedAt == null
    ? testData.standardFormAttachments.sorted()
    : { problem: 404.1 }),
  odataChunk: testData.submissionOData,
  keys: () => testData.standardKeys.sorted(),
  submitters: () => testData.extendedFieldKeys
    .sorted()
    .sort((fieldKey1, fieldKey2) =>
      fieldKey1.displayName.localeCompare(fieldKey2.displayName))
    .map(testData.toActor),
  submission: testData.submissionOData,
  audits: () => testData.extendedAudits.sorted(),
  comments: () => testData.extendedComments.sorted(),
  diffs: () => ({}),
  publicLinks: () => testData.standardPublicLinks.sorted(),
  fieldKeys: () => testData.extendedFieldKeys.sorted(),

  backupsConfig: () => (testData.standardBackupsConfigs.size !== 0
    ? testData.standardBackupsConfigs.last()
    : { problem: 404.1 })
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
  AccountLogin: new Map(),
  AccountResetPassword: new Map(),
  AccountClaim: new Map(),

  ProjectList: mapKeys(['projects', 'users']),
  ProjectShow: mapKeys(['project']),
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
  FormShow: mapKeys(['project', 'form', 'formDraft', 'attachments']),
  FormOverview: new Map(),
  FormVersionList: mapKeys(['formVersions']),
  FormSubmissions: mapKeys(['keys', 'fields', 'odataChunk', 'submitters']),
  PublicLinkList: mapKeys(['publicLinks']),
  FormSettings: new Map(),
  FormDraftStatus: mapKeys(['formVersions']),
  FormAttachmentList: new Map(),
  FormDraftTesting: mapKeys(['keys', 'fields', 'odataChunk']),
  SubmissionShow: mapKeys(['project', 'submission', 'audits', 'comments', 'diffs']),

  UserHome: new Map(),
  UserList: mapKeys(['users', 'actors']),
  UserEdit: mapKeys(['user']),
  AccountEdit: mapKeys(['user']),

  SystemHome: new Map(),
  BackupList: mapKeys(['backupsConfig', 'audits'], {
    audits: () => testData.standardAudits.sorted()
  }),
  AuditList: mapKeys(['audits']),

  Download: new Map(),

  NotFound: new Map()
};

export default (name) => {
  const map = mapsByComponent[name];
  if (map == null) throw new Error(`unknown component ${name}`);
  return map;
};
