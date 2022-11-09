import faker from 'faker';
import { pick, sum } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedProjects } from './projects';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';
import { fields as testDataFields } from './fields';
import { toActor } from './actors';



////////////////////////////////////////////////////////////////////////////////
// DATA STORES

// There is no direct access to these stores: they are not exported. Instead,
// use the views defined below.

let formVersions;

// These stats will not necessarily match testData.extendedSubmissions or the
// the project's lastSubmission property.
const submissionStats = (options = {}) => {
  const result = pick(['submissions', 'lastSubmission', 'reviewStates'], options);
  if (result.submissions == null) {
    result.submissions = result.reviewStates != null
      ? sum(Object.values(result.reviewStates))
      : (result.lastSubmission != null ? 1 : 0);
  }
  if (result.lastSubmission == null && result.submissions !== 0)
    result.lastSubmission = new Date().toISOString();
  if (result.reviewStates == null)
    result.reviewStates = { received: result.submissions, hasIssues: 0, edited: 0 };
  return result;
};

// Logical forms (the form itself, as distinct from the form version)
const forms = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    key = undefined,
    submissions = undefined,
    lastSubmission = undefined,
    reviewStates = undefined,
    project = extendedProjects.size !== 0
      ? extendedProjects.first()
      : extendedProjects
        .createPast(1, {
          key: key != null && key.managed ? key : null,
          forms: 1,
          lastSubmission
        })
        .last(),
    xmlFormId = `f${id !== 1 ? id : ''}`,
    name = faker.random.boolean() ? faker.name.findName() : null,
    enketoId = 'xyz',
    draft = !inPast,
    publishedAt = undefined,
    enketoOnceId = !draft ? 'zyx' : null,
    state = 'open',
    createdBy = extendedUsers.size !== 0
      ? extendedUsers.first()
      : extendedUsers.createPast(1).last(),
    fields = [testDataFields.string('/s')],
    entityRelated = false,

    ...extraVersionOptions
  }) => {
    const projectId = project.id;
    const form = {
      id,
      projectId,
      xmlFormId,
      name,
      enketoOnceId,
      state,
      entityRelated,
      // If publishedAt was specified, set createdAt to publishedAt in order to
      // ensure that createdAt is not after publishedAt.
      createdAt: !draft && publishedAt != null
        ? publishedAt
        : (inPast
          ? fakePastDate([lastCreatedAt, project.createdAt, createdBy.createdAt])
          : new Date().toISOString()),
      updatedAt: null,
      // Extended metadata
      createdBy: toActor(createdBy),
      // An actual form does not have this property. We include it here for ease
      // of access during testing.
      _fields: fields
    };
    const versionOptions = {
      ...extraVersionOptions,
      form,
      draft,
      key,
      publishedAt
    };
    Object.assign(draft ? versionOptions : form, {
      enketoId,
      submissions,
      lastSubmission,
      reviewStates
    });
    Object.assign(form, submissionStats(form));
    if (inPast)
      formVersions.createPast(1, versionOptions);
    else
      formVersions.createNew(versionOptions);
    return form;
  },
  sort: (form1, form2) => {
    const nameOrId1 = form1.name != null ? form1.name : form1.xmlFormId;
    const nameOrId2 = form2.name != null ? form2.name : form2.xmlFormId;
    return nameOrId1.localeCompare(nameOrId2);
  }
});

const sortByPublishedAt = (version1, version2) => {
  if (version1.publishedAt == null || version2.publishedAt == null)
    throw new Error('version must be published');
  if (isBefore(version1.publishedAt, version2.publishedAt)) return 1;
  if (isBefore(version2.publishedAt, version1.publishedAt)) return -1;
  return 0;
};

// All form versions: primary, draft, and archived.
formVersions = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    form = forms.first(),
    version = 'v1',
    draft = false,
    key = null,
    sha256 = 'a'.repeat(64),
    enketoId,
    publishedAt = undefined,
    excelContentType = null,
    submissions = undefined,
    lastSubmission = undefined,
    reviewStates = undefined,
    publishedBy = undefined,
    draftToken = draft ? faker.random.alphaNumeric(64) : null
  }) => {
    if (form === undefined) throw new Error('form not found');
    const result = {
      formId: form.id,
      version,
      keyId: key != null ? key.id : null,
      sha256,
      excelContentType
    };
    if (result.keyId == null) {
      const project = extendedProjects.sorted().find(p => p.id === form.projectId);
      if (project == null) throw new Error('project not found');
      result.keyId = project.keyId;
    }
    result.createdAt = !draft && publishedAt != null
      ? publishedAt
      : (inPast
        ? fakePastDate([lastCreatedAt, form.createdAt])
        : new Date().toISOString());
    if (draft) {
      Object.assign(result, {
        draftToken,
        enketoId,
        ...submissionStats({ submissions, lastSubmission, reviewStates })
      });
    } else {
      Object.assign(result, {
        publishedAt: publishedAt != null ? publishedAt : result.createdAt,
        publishedBy: publishedBy != null ? toActor(publishedBy) : form.createdBy
      });
    }
    return result;
  },
  sort: sortByPublishedAt
});



////////////////////////////////////////////////////////////////////////////////
// VIEWS

// Properties from `forms` above that will be added to all forms and form
// versions in the views below
const basicFormProps = [
  'projectId',
  'xmlFormId',
  'name',
  'enketoOnceId',
  'state',
  'createdAt',
  'updatedAt',
  '_fields'
];
// Properties from formVersions above that will be added to all forms and form
// versions in the views below
const basicVersionProps = ['version', 'keyId', 'publishedAt', 'draftToken'];

const findVersionForForm = (form) => {
  let draft;
  for (let i = formVersions.size - 1; i >= 0; i -= 1) {
    const version = formVersions.get(i);
    if (version.formId === form.id) {
      if (version.publishedAt != null) return version;
      draft = version;
    }
  }
  if (draft == null) throw new Error('version not found');
  return draft;
};
const findFormForVersion = (version) => {
  const form = forms.sorted().find(f => f.id === version.formId);
  if (form == null) throw new Error('form not found');
  return form;
};

export const standardForms = view(
  forms,
  (form) => ({
    ...pick([...basicFormProps, 'enketoId'], form),
    ...pick(basicVersionProps, findVersionForForm(form))
  })
);
export const extendedForms = view(
  forms,
  (form) => {
    const version = findVersionForForm(form);
    return {
      ...pick([...basicFormProps, 'enketoId', 'createdBy', 'entityRelated'], form),
      ...pick([...basicVersionProps, 'excelContentType'], version),
      ...pick(
        ['submissions', 'lastSubmission', 'reviewStates'],
        version.publishedAt == null ? version : form
      )
    };
  }
);
export const standardFormVersions = view(
  formVersions,
  (version) => ({
    ...pick(basicFormProps, findFormForVersion(version)),
    ...pick(basicVersionProps, version)
  })
);
export const extendedFormVersions = view(
  formVersions,
  (version) => ({
    ...pick(basicFormProps, findFormForVersion(version)),
    ...pick([...basicVersionProps, 'excelContentType', 'publishedBy'], version)
  })
);
export const standardFormDrafts = view(
  formVersions,
  (version) => ({
    ...pick(basicFormProps, findFormForVersion(version)),
    ...pick([...basicVersionProps, 'enketoId'], version)
  })
);
export const extendedFormDrafts = view(
  formVersions,
  (version) => ({
    ...pick([...basicFormProps, 'createdBy', 'entityRelated'], findFormForVersion(version)),
    ...pick(
      [...basicVersionProps, 'enketoId', 'excelContentType', 'submissions', 'reviewStates'],
      version
    )
  })
);

// Similar to extendedFormVersions.sorted(), but also filters out form drafts.
extendedFormVersions.published = () => {
  const published = [];
  for (let i = 0; i < extendedFormVersions.size; i += 1) {
    const version = extendedFormVersions.get(i);
    if (version.publishedAt != null) published.push(version);
  }
  return published.sort(sortByPublishedAt);
};

extendedForms.update = function update(index, props = undefined) {
  forms.update(
    index,
    props != null ? pick(['enketoId', 'enketoOnceId', 'state'], props) : props
  );
  return this.get(index);
};
extendedFormDrafts.update = function update(index, props = undefined) {
  formVersions.update(index, props != null ? pick(['enketoId'], props) : props);
  return this.get(index);
};
extendedFormDrafts.publish = (index) => {
  if (extendedUsers.size === 0) throw new Error('user not found');
  formVersions.update(index, {
    enketoId: null,
    publishedAt: new Date().toISOString(),
    submissions: null,
    lastSubmission: null,
    reviewStates: null,
    publishedBy: toActor(extendedUsers.first()),
    draftToken: null
  });
};
