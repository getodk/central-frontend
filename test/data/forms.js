import faker from 'faker';
import { pick } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedProjects } from './projects';
import { extendedUsers } from './users';
import { fakePastDate } from '../util/date-time';
import { toActor } from './actors';



////////////////////////////////////////////////////////////////////////////////
// DATA STORES

// There is no direct access to these stores: they are not exported. Instead,
// use the views defined below.

const defaultFields = (hasInstanceId) => {
  const instanceIdFields = [];
  if (hasInstanceId) {
    if (faker.random.boolean())
      instanceIdFields.push(
        { path: '/meta', type: 'structure' },
        { path: '/meta/instanceID', type: 'string' }
      );
    else
      instanceIdFields.push({ path: '/instanceID', type: 'string' });
  }

  return [
    ...instanceIdFields,
    { path: '/testInt', type: 'int' },
    { path: '/testDecimal', type: 'decimal' },
    { path: '/testDate', type: 'date' },
    { path: '/testTime', type: 'time' },
    { path: '/testDateTime', type: 'dateTime' },
    { path: '/testGeopoint', type: 'geopoint' },
    { path: '/testGroup', type: 'structure' },
    { path: '/testGroup/testBinary', type: 'binary' },
    // The column header for this question will be the same as the
    // previous question's.
    { path: '/testGroup-testBinary', type: 'binary' },
    { path: '/testBranch' },
    { path: '/testString1', type: 'string' },
    { path: '/testString2', type: 'string' },
    { path: '/testRepeat', type: 'repeat' },
    { path: '/testRepeat/testString3', type: 'string' }
  ];
};

let formVersions;

// Logical forms (the form itself, as distinct from the form version)
const forms = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    project = extendedProjects.size !== 0
      ? extendedProjects.first()
      : extendedProjects.createPast(1, { forms: 1 }).last(),
    xmlFormId = `f${id !== 1 ? id : ''}`,
    name = faker.random.boolean() ? faker.name.findName() : null,
    state = !inPast
      ? 'open'
      : faker.random.arrayElement(['open', 'closing', 'closed']),
    createdBy = extendedUsers.size !== 0
      ? extendedUsers.first()
      : extendedUsers.createPast(1).last(),

    hasInstanceId = faker.random.boolean(),
    fields = defaultFields(hasInstanceId),

    draft = !inPast,
    ...rest
  }) => {
    const form = {
      project,
      projectId: project.id,
      xmlFormId,
      name,
      state,
      createdAt: inPast
        ? fakePastDate([lastCreatedAt, project.createdAt, createdBy.createdAt])
        : new Date().toISOString(),
      updatedAt: null,
      // Extended metadata
      createdBy: toActor(createdBy),
      // An actual form does not have this property. We include it here for ease
      // of access during testing.
      _fields: fields
    };
    const versionOptions = { ...rest, form, draft };
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

// All form versions: primary, draft, and archived.
formVersions = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    form = forms.first(),
    version = 'v1',
    key = null,
    draft = false,
    excelContentType = null,
    submissions = 0,
    lastSubmission = undefined,
    publishedBy = undefined,
    draftToken = draft ? faker.random.alphaNumeric(64) : null
  }) => {
    if (form === undefined) throw new Error('form not found');
    const createdAt = inPast
      ? fakePastDate([lastCreatedAt, form.createdAt])
      : new Date().toISOString();
    return {
      form,
      version,
      keyId: key != null ? key.id : form.project.keyId,
      createdAt,
      publishedAt: !draft ? createdAt : null,
      // Extended form, extended form version, and extended form draft
      excelContentType,
      // Extended form and extended form draft
      // This property does not necessarily match testData.extendedSubmissions.
      submissions,
      // This property does not necessarily match testData.extendedProjects or
      // testData.extendedSubmissions.
      lastSubmission: lastSubmission != null
        ? lastSubmission
        : (submissions !== 0 ? fakePastDate([createdAt]) : null),
      // Extended form version
      publishedBy: publishedBy != null
        ? toActor(publishedBy)
        : (!draft ? form.createdBy : null),
      // Form draft
      draftToken
    };
  }
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
const draftProps = ['draftToken'];

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
extendedForms.updateState = function updateState(index, state) {
  if (typeof index !== 'number') throw new Error('invalid index');
  forms.update(index, { state });
  return this.get(index);
};

export const extendedFormVersions = view(
  formVersions,
  transformVersion(formProps, [...versionProps, ...extendedVersionProps])
);

export const extendedFormDrafts = view(
  formVersions,
  transformVersion(
    [...formProps, ...extendedFormProps],
    [...versionProps, ...versionPropsForExtendedForm, ...draftProps]
  )
);
extendedFormDrafts.publish = (index) => {
  if (typeof index !== 'number') throw new Error('invalid index');
  if (extendedUsers.size === 0) throw new Error('user not found');
  formVersions.update(index, {
    publishedAt: new Date().toISOString(),
    submissions: 0,
    lastSubmission: null,
    publishedBy: toActor(extendedUsers.first())
  });
};
