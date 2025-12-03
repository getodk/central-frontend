import { T, comparator, omit, pick } from 'ramda';
import { faker } from '@faker-js/faker';

import { dataStore, view } from './data-store';
import { extendedAudits } from './audits';
import { extendedDatasets } from './datasets';
import { extendedForms } from './forms';
import { extendedSubmissions } from './submissions';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';
import { toActor } from './actors';
import { wktToGeojson } from '../util/data';

// This will be the entities store. We define it immediately to prevent an
// ESLint error.
let entities;

const diffVersions = (dataReceived, previousVersion) => {
  if (previousVersion == null) return [];
  const diff = Object.keys(dataReceived).filter(name =>
    name !== 'label' && dataReceived[name] !== previousVersion.data[name]);
  if (dataReceived.label != null && dataReceived.label !== previousVersion.label)
    diff.unshift('label');
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
    branchId = null,
    trunkVersion = null,
    branchBaseVersion = null,
    conflictingProperties = undefined,
    source = {},
    creator = extendedUsers.first(),

    // Internal option for the `entities` store. This is an entity that is in
    // the process of being created.
    _entity = undefined
  }) => {
    // Get the entity.
    if (entities.size === 0 && _entity == null)
      throw new Error('there is no entity for which to create a new version');
    const entityIndex = _entity != null
      ? null
      : (uuid != null
        ? entities.findIndex(entity => entity.uuid === uuid)
        : entities.size - 1);
    if (entityIndex === -1) throw new Error('entity not found');
    const entity = _entity ?? entities.get(entityIndex);

    // Find the last version (i.e., the current/server version) and the base
    // version.
    let lastVersionIndex;
    let baseVersionIndex;
    for (const [i, version] of entityVersions.entries()) {
      if (version.uuid === entity.uuid) {
        lastVersionIndex = i;
        if (version.version === baseVersionOption) baseVersionIndex = i;
      }
    }
    const lastVersion = lastVersionIndex != null
      ? entityVersions.get(lastVersionIndex)
      : null;
    if (baseVersionOption != null) {
      if (baseVersionIndex == null) throw new Error('base version not found');
    } else if (branchId == null) {
      baseVersionIndex = lastVersionIndex;
    // If it is an offline update, but baseVersion wasn't specified, see if
    // lastVersion is the correct base version.
    } else if (lastVersion != null) {
      if (
        // If there's only one version on the server, the new version will have
        // to based on it.
        lastVersion.version === 1 ||

        // First update from the branch, with a trunk version (not following an
        // offline create). An offline update without a trunk version (one
        // following an offline create) is handled by the condition above.
        ((trunkVersion != null && branchBaseVersion === trunkVersion &&
        lastVersion.version === trunkVersion) ||

        // Later update from the branch (either after an offline create or not)
        (branchBaseVersion > (trunkVersion ?? 1) &&
        lastVersion.branchId === branchId &&
        lastVersion.branchBaseVersion === branchBaseVersion - 1)))
        baseVersionIndex = lastVersionIndex;
      else
        throw new Error('baseVersion is required for this offline update');
    }
    const baseVersion = baseVersionIndex != null
      ? entityVersions.get(baseVersionIndex)
      : null;

    // Update the last version and the base version.
    if (lastVersion != null) {
      const updates = { current: false };
      if (lastVersion.lastGoodVersion) {
        if (baseVersion === lastVersion)
          updates.lastGoodVersion = false;
        else
          updates.relevantToConflict = true;
      }
      entityVersions.update(lastVersionIndex, updates);
    }
    if (baseVersion !== lastVersion && !baseVersion.relevantToConflict)
      entityVersions.update(baseVersionIndex, { relevantToConflict: true });

    // Timestamps
    const createdAt = lastVersion == null
      ? entity.createdAt
      : (!inPast
        ? new Date().toISOString()
        : fakePastDate([lastCreatedAt, creator.createdAt]));
    if (lastVersion != null) {
      if (_entity != null)
        entity.updatedAt = createdAt;
      else
        entities.update(entityIndex, { updatedAt: createdAt });
    }

    const dataReceived = { ...data };
    if (label != null) dataReceived.label = label;
    const lastGoodVersion = (lastVersion == null || lastVersion.lastGoodVersion) &&
      baseVersion === lastVersion;
    return {
      uuid: entity.uuid,
      version: lastVersion == null ? 1 : lastVersion.version + 1,
      baseVersion: baseVersion == null ? null : baseVersion.version,
      current: true,
      label: label ?? lastVersion.label,
      data: { ...lastVersion?.data, ...data },
      dataReceived,
      branchId,
      trunkVersion,
      branchBaseVersion,
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
      lastGoodVersion,
      relevantToConflict: !lastGoodVersion,
      source,
      creatorId: creator.id,
      creator: toActor(creator),
      createdAt
    };
  }
});

export const extendedEntityVersions = view(entityVersions, omit(['uuid']));

const randomData = (properties) => {
  const data = {};
  for (const { name } of properties) data[name] = faker.word.adjective();
  return data;
};

entities = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    dataset: datasetOption = undefined,
    uuid = faker.string.uuid(),
    version = 1,
    label = faker.word.noun(),
    data = undefined,
    branchId = undefined,
    trunkVersion = undefined,
    branchBaseVersion = undefined,
    source = undefined,
    creator: creatorOption = undefined,
    deletedAt = null
  }) => {
    const newDataset = extendedDatasets.size === 0;
    if (newDataset) {
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
    if (newDataset) extendedDatasets.update(0, { lastEntity: createdAt });
    const entity = {
      uuid,
      creatorId: creator.id,
      creator: toActor(creator),
      createdAt,
      updatedAt: null,
      deletedAt
    };

    const createVersion = inPast
      ? (options) => entityVersions.createPast(1, options)
      : (options) => entityVersions.createNew(options);
    createVersion({
      _entity: entity,
      label,
      data: data ?? randomData(dataset.properties),
      branchId,
      trunkVersion,
      branchBaseVersion,
      source,
      creator
    });
    for (let i = 2; i <= version; i += 1)
      createVersion({ _entity: entity, creator });

    return entity;
  },
  sort: comparator((entity1, entity2) =>
    isBefore(entity2.createdAt, entity1.createdAt))
});

const combineEntityWithVersions = (entity) => {
  const currentVersion = entityVersions.findLast(version =>
    version.uuid === entity.uuid);

  const conflicts = currentVersion.version === 1
    ? []
    : entityVersions.filter(version =>
      version.uuid === entity.uuid && version.conflict != null && !version.resolved);
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
    conflict,
    updates: currentVersion.version - 1
  };
};
export const extendedEntities = view(entities, combineEntityWithVersions);
export const standardEntities = view(entities, (entity) =>
  omit(['creator'], combineEntityWithVersions(entity)));

// Converts entity response objects to OData.
const restToOData = (filterExpression) => (top = 250, skip = 0, asc = false) => {
  if (extendedDatasets.size === 0) throw new Error('dataset not found');
  // There needs to be exactly one dataset for us to be able to identify the
  // correct one.
  if (extendedDatasets.size > 1) throw new Error('too many datasets');

  const sorted = extendedEntities.sorted().filter(filterExpression);
  if (asc) sorted.reverse();

  const { properties } = extendedDatasets.last();
  return {
    '@odata.count': sorted.length,
    value: sorted.slice(skip, skip + top).map(entity => {
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
          updatedAt: entity.updatedAt,
          deletedAt: entity.deletedAt
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
export const entityOData = restToOData(entity => entity.deletedAt == null);
export const entityDeletedOData = restToOData(entity => entity.deletedAt != null);

// In testing, we assume that the entity `geometry` property is WKT, but that's
// not actually the case in production. We just assume that to parallel
// submission OData, where geo fields are returned as WKT. We could use the
// actual ODK format for `geometry`, but we'd end up just converting it to
// GeoJSON anyway.
export const entityGeojson = (filterExpression = T) => ({
  type: 'FeatureCollection',
  features: extendedEntities.sorted()
    .filter(filterExpression)
    .map(entity => {
      const geojson = wktToGeojson(entity.currentVersion.data.geometry);
      return geojson != null ? { ...geojson, id: entity.uuid } : null;
    })
    .filter(geojson => geojson)
});

// Creates a source submission along with submission audit log events.
extendedEntities.createSourceSubmission = (sourceAction, submissionOptions = {}, deleted = false) => {
  const fullSubmission = extendedSubmissions
    .createPast(1, submissionOptions)
    .last();
  const formVersion = submissionOptions.formVersion ?? extendedForms.first();
  const submission = (!deleted)
    ? { ...fullSubmission, xmlFormId: formVersion.xmlFormId }
    : {
      instanceId: fullSubmission.instanceId,
      submitter: fullSubmission.submitter,
      createdAt: fullSubmission.createdAt
    };

  const auditOptions = {
    actor: submission.submitter,
    actee: formVersion,
    details: { instanceId: submission.instanceId }
  };
  extendedAudits
    .createPast(1, {
      action: 'submission.create',
      loggedAt: submission.createdAt,
      ...auditOptions
    });
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
  const event = extendedAudits.last();

  return { submission, event };
};

extendedEntities.resolve = (index) => {
  const entity = entities.get(index);
  if (entity == null) throw new Error('entity not found');

  const lastIndex = entityVersions.findLastIndex(version =>
    version.uuid === entity.uuid);
  for (const [i, version] of entityVersions.entries()) {
    // eslint-disable-next-line no-continue
    if (version.uuid !== entity.uuid) continue;
    const updates = {};
    if (version.conflict != null && !version.resolved) updates.resolved = true;
    if (version.lastGoodVersion) updates.lastGoodVersion = false;
    if (i === lastIndex) updates.lastGoodVersion = true;
    if (version.relevantToConflict) updates.relevantToConflict = false;
    if (Object.keys(updates).length !== 0) entityVersions.update(i, updates);
  }

  // Update updatedAt.
  entities.update(index);
};
