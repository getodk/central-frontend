import faker from 'faker';
import { pick } from 'ramda';

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

// Logical forms (the form itself, as distinct from the form version)
const forms = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    submissions = undefined,
    lastSubmission = submissions != null && submissions !== 0
      ? new Date().toISOString()
      : undefined,
    project = extendedProjects.size !== 0
      ? extendedProjects.first()
      : extendedProjects.createPast(1, { forms: 1, lastSubmission }).last(),
    xmlFormId = `f${id !== 1 ? id : ''}`,
    name = faker.random.boolean() ? faker.name.findName() : null,
    enketoId = 'xyz',
    draft = !inPast,
    publishedAt = undefined,
    enketoOnceId = !draft ? 'zyx' : null,
    state = !inPast
      ? 'open'
      : faker.random.arrayElement(['open', 'closing', 'closed']),
    createdBy = extendedUsers.size !== 0
      ? extendedUsers.first()
      : extendedUsers.createPast(1).last(),
    fields = [testDataFields.string('/s')],

    ...rest
  }) => {
    const form = {
      project,
      projectId: project.id,
      xmlFormId,
      name,
      enketoId: !draft ? enketoId : null,
      enketoOnceId,
      state,
      createdAt: publishedAt != null
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
      ...rest,
      form,
      draft,
      publishedAt,
      enketoId: draft ? enketoId : null,
      submissions,
      lastSubmission
    };
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
    key = null,
    sha256 = 'a'.repeat(64),
    enketoId,
    draft = false,
    publishedAt = undefined,
    excelContentType = null,
    submissions = undefined,
    lastSubmission = undefined,
    publishedBy = undefined,
    draftToken = draft ? faker.random.alphaNumeric(64) : null
  }) => {
    if (form === undefined) throw new Error('form not found');
    const result = {
      form,
      version,
      keyId: key != null ? key.id : form.project.keyId,
      sha256,
      enketoId,
      // Extended form, extended form version, and extended form draft
      excelContentType,
      // Extended form version
      publishedBy: publishedBy != null
        ? toActor(publishedBy)
        : (!draft ? form.createdBy : null),
      // Form draft
      draftToken
    };

    if (publishedAt != null) {
      result.publishedAt = publishedAt;
      result.createdAt = publishedAt;
    } else {
      result.createdAt = inPast
        ? fakePastDate([lastCreatedAt, form.createdAt])
        : new Date().toISOString();
      if (!draft) result.publishedAt = result.createdAt;
    }

    if (submissions != null) {
      // This property does not necessarily match testData.extendedSubmissions.
      result.submissions = submissions;
      // This property does not necessarily match testData.extendedProjects or
      // testData.extendedSubmissions.
      result.lastSubmission = lastSubmission != null
        ? lastSubmission
        : (submissions !== 0 ? new Date().toISOString() : null);
    } else if (lastSubmission != null) {
      result.submissions = 1;
      result.lastSubmission = lastSubmission;
    } else {
      result.submissions = 0;
    }

    return result;
  },
  sort: sortByPublishedAt
});



////////////////////////////////////////////////////////////////////////////////
// VIEWS

const findPrimaryVersion = (form) => {
  for (let i = formVersions.size - 1; i >= 0; i -= 1) {
    const version = formVersions.get(i);
    if (version.form === form && version.publishedAt != null) return version;
  }
  return null;
};

const transformForm = (formProps, versionProps) => (form) => {
  const data = pick(formProps, form);
  data.enketoId = form.enketoId;

  const primary = findPrimaryVersion(form);
  if (primary != null) {
    // We should probably sum `submissions` for all published versions, rather
    // than simply copying it from the primary version.
    Object.assign(data, pick(versionProps, primary));
  } else if (versionProps.includes('submissions')) {
    data.submissions = 0;
  }

  return data;
};
const transformVersion = (formProps, versionProps) => (version) =>
  ({ ...pick(formProps, version.form), ...pick(versionProps, version) });

const formProps = [
  'projectId',
  'xmlFormId',
  'name',
  'enketoOnceId',
  'state',
  'createdAt',
  'updatedAt',
  '_fields'
];
const extendedFormProps = ['createdBy'];
const versionProps = ['version', 'keyId', 'publishedAt'];
const versionPropsForExtendedForm = [
  'excelContentType',
  'submissions',
  'lastSubmission'
];
const extendedVersionProps = ['excelContentType', 'publishedBy'];
const draftProps = ['enketoId', 'draftToken'];

export const standardForms = view(
  forms,
  transformForm(formProps, versionProps)
);

export const extendedForms = view(
  forms,
  transformForm(
    [...formProps, ...extendedFormProps],
    [...versionProps, ...versionPropsForExtendedForm]
  )
);
extendedForms.update = function update(index, props = undefined) {
  forms.update(
    index,
    props != null ? pick(['enketoId', 'enketoOnceId', 'state'], props) : props
  );
  return this.get(index);
};

export const extendedFormVersions = view(
  formVersions,
  transformVersion(formProps, [...versionProps, ...extendedVersionProps])
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

export const standardFormDrafts = view(
  formVersions,
  transformVersion(formProps, [...versionProps, ...draftProps])
);

export const extendedFormDrafts = view(
  formVersions,
  transformVersion(
    [...formProps, ...extendedFormProps],
    [...versionProps, ...versionPropsForExtendedForm, ...draftProps]
  )
);
extendedFormDrafts.update = function update(index, props = undefined) {
  formVersions.update(index, props != null ? pick(['enketoId'], props) : props);
  return this.get(index);
};
extendedFormDrafts.publish = (index) => {
  if (extendedUsers.size === 0) throw new Error('user not found');
  formVersions.update(index, {
    enketoId: null,
    publishedAt: new Date().toISOString(),
    submissions: 0,
    lastSubmission: null,
    publishedBy: toActor(extendedUsers.first())
  });
};
