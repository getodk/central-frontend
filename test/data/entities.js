import faker from 'faker';
import { comparator, last, omit, pick } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedAudits } from './audits';
import { extendedDatasets } from './datasets';
import { extendedForms } from './forms';
import { extendedSubmissions } from './submissions';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';
import { toActor } from './actors';

// This will be the entities store. We define it immediately to prevent an
// ESLint error.
let entities;

const diffVersions = (dataReceived, previousVersion) => {
  if (previousVersion == null) return [];
  const diff = Object.keys(dataReceived).filter(name =>
    name !== 'label' && dataReceived[name] !== previousVersion.data[name]);
  if (dataReceived.label != null && dataReceived.label !== previousVersion.label)
    diff.push('label');
  return diff;
};

const entityVersions = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    // If no UUID is specified, defaults to the last entity.
    uuid = undefined,
    baseVersion: baseVersionOption = undefined,
    label = undefined,
    data = {},
    conflictingProperties = undefined,
    creator = extendedUsers.first(),

    // Internal option for the `entities` store
    _entity = undefined
  }) => {
    if (entities.size === 0 && _entity == null)
      throw new Error('there is no entity for which to create a new version');
    const entity = _entity ?? (uuid != null
      ? entities.sorted().find(e => e.uuid === uuid)
      : entities.last());
    if (entity == null) throw new Error('entity not found');

    const versions = entityVersions.sorted()
      .filter(version => version.entity === entity);
    const lastVersion = last(versions);
    if (lastVersion != null) lastVersion.current = false;

    const baseVersion = baseVersionOption == null || baseVersionOption === lastVersion?.version
      ? lastVersion
      : versions.find(version => version.version === baseVersionOption);
    if (baseVersionOption != null && baseVersion == null)
      throw new Error('base version not found');

    const createdAt = lastVersion == null
      ? entity.createdAt
      : (!inPast
        ? new Date().toISOString()
        : fakePastDate([lastCreatedAt, creator.createdAt]));
    if (lastVersion != null) entity.updatedAt = createdAt;

    const dataReceived = { ...data };
    if (label != null) dataReceived.label = label;
    return {
      entity,
      version: versions.length + 1,
      baseVersion: baseVersion == null ? null : baseVersion.version,
      current: true,
      label: label ?? lastVersion.label,
      data: { ...lastVersion?.data, ...data },
      conflict: baseVersion === lastVersion
        ? null
        : (conflictingProperties != null && conflictingProperties.length !== 0
          ? 'hard'
          : 'soft'),
      conflictingProperties: baseVersion === lastVersion
        ? null
        : conflictingProperties ?? [],
      baseDiff: diffVersions(dataReceived, baseVersion),
      serverDiff: diffVersions(dataReceived, lastVersion),
      resolved: false,
      creatorId: creator.id,
      creator: toActor(creator),
      createdAt
    };
  }
});

export const extendedEntityVersions = view(entityVersions, omit(['entity']));

const randomData = (properties) => {
  const data = {};
  for (const { name } of properties) data[name] = faker.random.word();
  return data;
};

entities = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    dataset: datasetOption = undefined,
    uuid = faker.random.uuid(),
    version = 1,
    label = faker.random.word(),
    data = undefined,
    creator: creatorOption = undefined,
    conflict = null
  }) => {
    if (extendedDatasets.size === 0) {
      const properties = data != null
        ? Object.keys(data).map(name => ({ name, forms: [] }))
        : [];
      extendedDatasets.createPast(1, { properties, entities: 1 });
    }
    const dataset = datasetOption ?? extendedDatasets.first();

    const creator = creatorOption ?? extendedUsers.first();
    const createdAt = !inPast
      ? new Date().toISOString()
      : fakePastDate([
        lastCreatedAt,
        creator.createdAt
      ]);
    const entity = {
      uuid,
      creatorId: creator.id,
      creator: toActor(creator),
      createdAt,
      updatedAt: null,
      conflict
    };

    const createVersion = inPast
      ? (options) => entityVersions.createPast(1, options)
      : (options) => entityVersions.createNew(options);
    createVersion({
      _entity: entity,
      label,
      data: data ?? randomData(dataset.properties),
      creator
    });
    for (let i = 2; i <= version; i += 1)
      createVersion({ _entity: entity, creator });

    return entity;
  },
  sort: comparator((entity1, entity2) =>
    isBefore(entity2.createdAt, entity1.createdAt))
});

const findCurrentVersion = (entity) => {
  for (let i = entityVersions.size - 1; i >= 0; i -= 1) {
    const version = entityVersions.get(i);
    if (version.entity === entity) return version;
  }
  throw new Error('current version not found');
};
const combineEntityWithVersions = (entity) => {
  const currentVersion = findCurrentVersion(entity);

  const conflicts = currentVersion.version === 1
    ? []
    : entityVersions.sorted().filter(version =>
      version.entity === entity && version.conflict != null && !version.resolved);
  const conflict = conflicts.length === 0
    ? null
    : (conflicts.some(version => version.conflict === 'hard') ? 'hard' : 'soft');

  return {
    ...entity,
    // Add just the properties of currentVersion that are needed. That way, we
    // don't have to think about extended metadata.
    currentVersion: pick(
      ['version', 'label', 'data', 'current'],
      currentVersion
    ),
    conflict: conflict || entity.conflict,
    updates: currentVersion.version - 1
  };
};
export const extendedEntities = view(entities, combineEntityWithVersions);
export const standardEntities = view(entities, (entity) =>
  omit(['creator'], combineEntityWithVersions(entity)));

// Converts entity response objects to OData.
export const entityOData = (top = 250, skip = 0) => {
  if (extendedDatasets.size === 0) throw new Error('dataset not found');
  // There needs to be exactly one dataset for us to be able to identify the
  // correct one.
  if (extendedDatasets.size > 1) throw new Error('too many datasets');
  const { properties } = extendedDatasets.last();

  return {
    '@odata.count': extendedEntities.size,
    '@odata.nextLink': top > 0 && (top + skip < extendedEntities.size) ? `https://test/Entities?$top=${top}&$skipToken=thetoken` : undefined,
    value: extendedEntities.sorted().slice(skip, skip + top).map(entity => {
      const result = {
        label: entity.currentVersion.label,
        __id: entity.uuid,
        __system: {
          version: entity.currentVersion.version,
          updates: entity.updates,
          conflict: entity.conflict,
          creatorId: entity.creator.id.toString(),
          creatorName: entity.creator.displayName,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt
        }
      };

      const { data } = entity.currentVersion;
      // Iterate over all dataset properties, not just those in `data`.
      for (const { name, odataName } of properties)
        result[odataName] = name in data ? data[name] : null;

      return result;
    })
  };
};

// Creates a source submission along with submission audit log events.
extendedEntities.createSourceSubmission = (sourceAction, submissionOptions = {}) => {
  const submission = extendedSubmissions
    .createPast(1, submissionOptions)
    .last();
  const formVersion = submissionOptions.formVersion ?? extendedForms.first();
  const submissionWithFormId = {
    ...submission,
    xmlFormId: formVersion.xmlFormId
  };

  const auditOptions = {
    actor: submission.submitter,
    actee: formVersion,
    details: { instanceId: submission.instanceId }
  };
  const submissionCreate = extendedAudits
    .createPast(1, {
      action: 'submission.create',
      loggedAt: submission.createdAt,
      ...auditOptions
    })
    .last();
  if (sourceAction === 'submission.update') {
    extendedSubmissions.update(-1, { reviewState: 'approved' });
    extendedAudits.createPast(1, {
      action: 'submission.update',
      ...auditOptions
    });
  } else if (sourceAction === 'submission.update.version') {
    extendedSubmissions.update(-1, { reviewState: 'edited', edits: 1 });
    extendedAudits.createPast(1, {
      action: 'submission.update.version',
      ...auditOptions
    });
  } else if (sourceAction !== 'submission.create') {
    throw new Error('invalid action');
  }
  const sourceEvent = extendedAudits.last();

  return { submission: submissionWithFormId, submissionCreate, sourceEvent };
};

extendedEntities.resolve = (index) => {
  const entity = entities.get(index);
  if (entity == null) throw new Error('entity not found');

  for (const version of entityVersions.sorted()) {
    if (version.entity === entity && version.conflict != null)
      version.resolved = true;
  }

  // Update updatedAt.
  entities.update(index);
};
