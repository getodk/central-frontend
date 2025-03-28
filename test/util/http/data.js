import { pick } from 'ramda';

import useForm from '../../../src/request-data/form';
import useProject from '../../../src/request-data/project';
import useDatasets from '../../../src/request-data/datasets';

import testData from '../../data';
import { mockResponse } from '../axios';
import simpleXml from '../../data/simple';

// The names of the following properties correspond to requestData resources.
const responseDefaults = {
  // Resources created in createResources()
  roles: () => testData.standardRoles.sorted(),
  project: () => testData.extendedProjects.last(),
  dataset: () => testData.extendedDatasets.last(),

  // useProject()
  forms: () => testData.extendedForms.sorted(),
  fieldKeys: () => testData.extendedFieldKeys.sorted(),
  // useForm()
  formVersions: [
    ({ url }) => /^\/v1\/projects\/\d+\/forms\/[^/]+\/versions$/.test(url),
    () => testData.extendedFormVersions.published()
  ],

  // Common local resources
  users: () => testData.standardUsers.sorted(),
  user: () => testData.standardUsers.last(),
  odataEntities: testData.entityOData,
  audits: () => testData.extendedAudits.sorted()
};

const componentResponses = (map) => Object.entries(map)
  .map(([resourceName, response]) => [
    resourceName,
    response === true ? responseDefaults[resourceName] : response
  ]);

const responsesByComponent = {
  ConfigError: [],

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

    // Conditional responses (mockHttp().respondIf())
    publishedAttachments: [
      ({ url }) => /^\/v1\/projects\/\d+\/forms\/[^/]+\/attachments$/.test(url),
      () => testData.standardFormAttachments.sorted()
    ],
    formDatasetDiff: [
      ({ url }) => /^\/v1\/projects\/\d+\/forms\/[^/]+\/dataset-diff$/.test(url),
      () => testData.formDatasetDiffs.sorted()
    ],
    appUserCount: [
      ({ url }) => /^\/v1\/projects\/\d+\/forms\/[^/]+\/assignments\/app-user$/.test(url),
      () => testData.extendedFieldKeys.sorted()
    ]
  }),
  FormPreview: componentResponses({
    form: () => testData.extendedForms.last(),
    xml: () => mockResponse.of(simpleXml)
  }),
  FormSubmission: componentResponses({
    project: true,
    form: () => testData.extendedForms.last()
  }),
  FormSubmissions: componentResponses({
    keys: () => testData.standardKeys.sorted(),
    deletedSubmissionCount: () => testData.submissionDeletedOData(0),
    fields: () => testData.extendedForms.last()._fields,
    odata: testData.submissionOData,
    submitters: () => testData.extendedFieldKeys
      .sorted()
      .sort((fieldKey1, fieldKey2) =>
        fieldKey1.displayName.localeCompare(fieldKey2.displayName))
      .map(testData.toActor)
  }),
  PublicLinkList: componentResponses({
    publicLinks: () => testData.standardPublicLinks.sorted()
  }),
  FormVersionList: componentResponses({ formVersions: true }),
  FormEdit: componentResponses({
    formDraft: () => (testData.extendedFormVersions.last().publishedAt == null
      ? testData.extendedFormDrafts.last()
      : mockResponse.problem(404.1)),

    draftAttachments: [
      ({ url }) => /^\/v1\/projects\/\d+\/forms\/[^/]+\/draft\/attachments$/.test(url),
      () => testData.standardFormAttachments.sorted()
    ],
    formVersions: true,
    formDraftDatasetDiff: [
      ({ url }) => /^\/v1\/projects\/\d+\/forms\/[^/]+\/draft\/dataset-diff$/.test(url),
      () => testData.formDraftDatasetDiffs.sorted()
    ],
    datasets: [
      ({ url }) => /^\/v1\/projects\/\d+\/datasets$/.test(url),
      () => testData.extendedDatasets.sorted()
    ],
    keys: [
      ({ url }) => /^\/v1\/projects\/\d+\/forms\/[^/]+\/draft\/submissions\/keys$/.test(url),
      () => testData.standardKeys.sorted()
    ],
    fields: [
      ({ url }) => /^\/v1\/projects\/\d+\/forms\/[^/]+\/draft\/fields\?/.test(url),
      () => testData.extendedForms.last()._fields
    ],
    odata: [
      ({ url }) => /^\/v1\/projects\/\d+\/forms\/[^/]+\/draft\.svc\/Submissions\?/.test(url),
      testData.submissionOData
    ]
  }),
  FormSettings: [],
  SubmissionShow: componentResponses({
    project: true,
    form: () => testData.extendedForms.last(),
    submission: () => {
      const odata = testData.submissionOData();
      const selected = odata.value.map(pick(['__id', '__system', 'meta']));
      return { ...odata, value: selected };
    },
    submissionVersion: () => ({}),
    fields: () => testData.extendedForms.last()._fields,
    audits: true,
    comments: () => testData.extendedComments.sorted(),
    diffs: () => ({})
  }),
  DatasetShow: componentResponses({
    project: true,
    dataset: true
  }),
  DatasetOverview: [],
  DatasetEntities: componentResponses({
    deletedEntityCount: () => testData.entityDeletedOData(0),
    odataEntities: true
  }),
  DatasetSettings: [],
  EntityShow: componentResponses({
    entity: () => testData.extendedEntities.last(),
    project: true,
    dataset: true,
    audits: () => testData.extendedAudits.sorted()
      .filter(({ action }) => action.startsWith('entity.')),
    entityVersions: () => testData.extendedEntityVersions.sorted()
  }),

  UserHome: [],
  UserList: componentResponses({
    users: true,
    adminIds: () => testData.standardUsers.sorted().map(testData.toActor)
  }),
  UserEdit: componentResponses({ user: true }),
  AccountEdit: componentResponses({ user: true }),

  SystemHome: [],
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
