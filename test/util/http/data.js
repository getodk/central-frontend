import useForm from '../../../src/request-data/form';
import useProject from '../../../src/request-data/project';
import useDatasets from '../../../src/request-data/datasets';

import testData from '../../data';
import { mockResponse } from '../axios';

// The names of the following properties correspond to requestData resources.
const responseDefaults = {
  // Resources created in createResources()
  roles: () => testData.standardRoles.sorted(),
  project: () => testData.extendedProjects.last(),

  // useProject()
  forms: () => testData.extendedForms.sorted(),
  fieldKeys: () => testData.extendedFieldKeys.sorted(),
  // useForm()
  formVersions: () => testData.extendedFormVersions.published(),
  // useFields()
  fields: () => testData.extendedForms.last()._fields,

  // Common local resources
  users: () => testData.standardUsers.sorted(),
  user: () => testData.standardUsers.last(),
  odata: testData.submissionOData,
  keys: () => testData.standardKeys.sorted(),
  audits: () => testData.extendedAudits.sorted()
};

for (const [resourceName, callback] of Object.entries(responseDefaults))
  responseDefaults[resourceName] = () => mockResponse.of(callback());

const componentResponses = (map) => Object.entries(map)
  .map(([resourceName, callbackOrTrue]) => {
    const callback = callbackOrTrue === true
      ? responseDefaults[resourceName]
      : () => mockResponse.of(callbackOrTrue());
    return [resourceName, callback];
  });

const responsesByComponent = {
  AccountLogin: [],
  AccountResetPassword: [],
  AccountClaim: [],

  Home: componentResponses({
    projects: () => testData.extendedProjects.sorted(),
    users: true
  }),
  ProjectShow: componentResponses({ project: true }),
  ProjectOverview: componentResponses({ forms: true, deletedForms: () => [] }),
  ProjectUserList: componentResponses({
    roles: true,
    projectAssignments: () => testData.extendedProjectAssignments.sorted()
  }),
  FieldKeyList: componentResponses({ fieldKeys: true }),
  ProjectFormAccess: componentResponses({
    forms: true,
    fieldKeys: true,
    roles: true,
    formSummaryAssignments: () => testData.standardFormSummaryAssignments.sorted()
  }),
  DatasetList: componentResponses({
    datasets: () => testData.extendedDatasets.sorted()
  }),
  ProjectSettings: [],
  FormShow: componentResponses({
    project: true,
    form: () => testData.extendedForms.last(),
    formDraft: () => (testData.extendedFormVersions.last().publishedAt == null
      ? testData.extendedFormDrafts.last()
      : mockResponse.problem(404.1)),
    attachments: () => (testData.extendedFormVersions.last().publishedAt == null
      ? testData.standardFormAttachments.sorted()
      : mockResponse.problem(404.1))
  }),
  FormOverview: [],
  FormVersionList: componentResponses({ formVersions: true }),
  FormSubmissions: componentResponses({
    keys: true,
    fields: true,
    odata: true,
    submitters: () => testData.extendedFieldKeys
      .sorted()
      .sort((fieldKey1, fieldKey2) =>
        fieldKey1.displayName.localeCompare(fieldKey2.displayName))
      .map(testData.toActor)
  }),
  PublicLinkList: componentResponses({
    publicLinks: () => testData.standardPublicLinks.sorted()
  }),
  FormSettings: [],
  FormDraftStatus: componentResponses({ formVersions: true }),
  FormAttachmentList: [],
  FormDraftTesting: componentResponses({
    keys: true,
    fields: true,
    odata: true
  }),
  SubmissionShow: componentResponses({
    project: true,
    submission: testData.submissionOData,
    submissionVersion: () => ({}),
    fields: true,
    audits: true,
    comments: () => testData.extendedComments.sorted(),
    diffs: () => ({})
  }),

  UserHome: [],
  UserList: componentResponses({
    users: true,
    adminIds: () => testData.standardUsers.sorted().map(testData.toActor)
  }),
  UserEdit: componentResponses({ user: true }),
  AccountEdit: componentResponses({ user: true }),

  SystemHome: [],
  BackupList: componentResponses({
    backupsConfig: () => {
      const config = testData.standardConfigs.forKey('backups');
      return config != null ? config : mockResponse.problem(404.1);
    },
    audits: () => testData.standardAudits.sorted()
  }),
  AuditList: componentResponses({ audits: true }),
  AnalyticsList: componentResponses({
    analyticsConfig: () => {
      const config = testData.standardConfigs.forKey('analytics');
      return config != null ? config : mockResponse.problem(404.1);
    },
    audits: true
  }),

  Download: [],

  NotFound: []
};

// For nested routes, specify the requestData composables that the parent route
// component uses.
const composablesByParent = {
  ProjectShow: [useProject, useDatasets],
  FormShow: [useForm, useDatasets]
};

export default (name) => {
  const responses = responsesByComponent[name];
  if (responses == null) throw new Error(`unknown component ${name}`);
  const composables = composablesByParent[name] != null
    ? composablesByParent[name]
    : [];
  return { composables, responses };
};
