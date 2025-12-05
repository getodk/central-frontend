import { pick } from 'ramda';

import useForm from '../../../src/request-data/form';
import useProject from '../../../src/request-data/project';
import useDatasets from '../../../src/request-data/datasets';
import { apiPaths } from '../../../src/util/request';

import testData from '../../data';
import { mockResponse } from '../axios';
import { relativeUrl } from '../request';

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
  audits: () => testData.extendedAudits.sorted()
};

/**
 * Checks if a given URL matches the expected API path pattern.
 *
 * This function converts an API path function into a regex pattern and tests
 * whether the provided URL conforms to that pattern.
 *
 * @param {Function} apiPathFn
 * A function that generates the expected API path. Optional arguments are ignored
 * @param {string} url
 * The URL to be tested against the API path pattern.
 * @returns {boolean}
 * `true` if the URL matches the expected API path pattern, otherwise `false`.
 */
const matchesApiPath = (apiPathFn, url) => {
  const ALPHA_NUMERIC = 'ALPHA_NUMERIC';
  const ALPH_NUMERIC_REGEX = '[^/]+';

  // call apiPathFn with placeholders, fn.length returns lenght of required args only
  const regex = new RegExp(`^${apiPathFn(...Array(apiPathFn.length).fill(ALPHA_NUMERIC))
    .replaceAll(ALPHA_NUMERIC, ALPH_NUMERIC_REGEX)}(\\?.+)?$`);

  return regex.test(url);
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
      ({ url }) => matchesApiPath(apiPaths.publishedAttachments, url),
      () => testData.standardFormAttachments.sorted()
    ],
    formDatasetDiff: [
      ({ url }) => matchesApiPath(apiPaths.formDatasetDiff, url),
      () => testData.formDatasetDiffs.sorted()
    ],
    appUserCount: [
      ({ url }) => matchesApiPath(apiPaths.formActors, url),
      () => testData.extendedFieldKeys.sorted()
    ]
  }),
  FormPreview: componentResponses({
    form: [
      ({ url }) => matchesApiPath(apiPaths.form, url) ||
                   matchesApiPath(apiPaths.formDraft, url),
      () => (testData.extendedFormVersions.last().publishedAt
        ? testData.extendedForms.last()
        : testData.extendedFormDrafts.last())
    ]
  }),
  FormSubmission: componentResponses({
    project: [
      ({ url }) => matchesApiPath(apiPaths.project, url),
      () => testData.extendedProjects.last()
    ],
    form: [
      ({ url }) => matchesApiPath(apiPaths.form, url) ||
                   matchesApiPath(apiPaths.formDraft, url) ||
                   matchesApiPath(apiPaths.formByEnketoId, url),
      () => (testData.extendedFormVersions.last().publishedAt
        ? testData.extendedForms.last()
        : testData.extendedFormDrafts.last())
    ]
  }),
  FormSubmissions: componentResponses({
    keys: () => testData.standardKeys.sorted(),
    fields: () => testData.extendedForms.last()._fields,
    submitters: () => testData.extendedFieldKeys
      .sorted()
      .sort((fieldKey1, fieldKey2) =>
        fieldKey1.displayName.localeCompare(fieldKey2.displayName))
      .map(testData.toActor),
    deletedSubmissionCount: [
      ({ url }) => {
        if (!url.includes('top=0')) return false;
        return matchesApiPath(
          (projectId, xmlFormId) => apiPaths.odataSubmissions(projectId, xmlFormId, false),
          url
        );
      },
      () => testData.submissionDeletedOData(0)
    ],
    odata: [
      ({ url }) => {
        if (url.includes('top=0')) return false;
        return matchesApiPath(
          (projectId, xmlFormId) => apiPaths.odataSubmissions(projectId, xmlFormId, false),
          url
        );
      },
      ({ url }) => {
        const filter = relativeUrl(url).searchParams.get('$filter');
        return filter.includes('__system/deletedAt eq null')
          ? testData.submissionOData()
          : testData.submissionDeletedOData();
      }
    ],
    geojson: [
      ({ url }) => matchesApiPath(
        (projectId, xmlFormId) => apiPaths.submissions(projectId, xmlFormId, false, '.geojson'),
        url
      ),
      () => testData.submissionGeojson(submission => submission.deletedAt == null)
    ]
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
      ({ url }) => matchesApiPath(apiPaths.formDraftAttachments, url),
      () => testData.standardFormAttachments.sorted()
    ],
    formVersions: true,
    formDraftDatasetDiff: [
      ({ url }) => matchesApiPath(apiPaths.formDraftDatasetDiff, url),
      () => testData.formDraftDatasetDiffs.sorted()
    ],
    datasets: [
      ({ url }) => matchesApiPath(apiPaths.datasets, url),
      () => testData.extendedDatasets.sorted()
    ],
    keys: [
      ({ url }) => matchesApiPath((projectId, xmlFormId) => apiPaths.submissionKeys(projectId, xmlFormId, true), url),
      () => testData.standardKeys.sorted()
    ],
    fields: [
      ({ url }) => matchesApiPath((projectId, xmlFormId) => apiPaths.fields(projectId, xmlFormId, true), url),
      () => testData.extendedForms.last()._fields
    ],
    odata: [
      ({ url }) => matchesApiPath((projectId, xmlFormId) => apiPaths.odataSubmissions(projectId, xmlFormId, true), url),
      () => testData.submissionOData()
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
    entityCreators: () => testData.extendedFieldKeys
      .sorted()
      .sort((fieldKey1, fieldKey2) =>
        fieldKey1.displayName.localeCompare(fieldKey2.displayName))
      .map(testData.toActor),
    deletedEntityCount: [
      ({ url }) => matchesApiPath(apiPaths.odataEntities, url) && url.includes('top=0'),
      () => testData.entityDeletedOData(0)
    ],
    odata: [
      ({ url }) => matchesApiPath(apiPaths.odataEntities, url) && !url.includes('top=0'),
      ({ url }) => {
        const filter = relativeUrl(url).searchParams.get('$filter');
        return filter.includes('__system/deletedAt eq null')
          ? testData.entityOData()
          : testData.entityDeletedOData();
      }
    ],
    geojson: [
      ({ url }) => matchesApiPath(
        (projectId, datasetName) => apiPaths.entities(projectId, datasetName, '.geojson'),
        url
      ),
      () => testData.entityGeojson(entity => entity.deletedAt == null)
    ]
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
