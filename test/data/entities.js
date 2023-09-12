import faker from 'faker';
import { comparator, omit } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedAudits } from './audits';
import { extendedDatasets } from './datasets';
import { extendedForms } from './forms';
import { extendedSubmissions } from './submissions';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';
import { toActor } from './actors';

const randomData = (properties) => {
  const data = {};
  for (const { name } of properties) data[name] = faker.random.word();
  return data;
};

export const extendedEntities = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    uuid = faker.random.uuid(),
    label = faker.random.word(),
    updates = 0,
    updatedAt = null,
    version = 1,
    ...options
  }) => {
    if (extendedDatasets.size === 0) {
      const properties = options.data != null
        ? Object.keys(options.data).map(name => ({ name, forms: [] }))
        : [];
      extendedDatasets.createPast(1, { properties, entities: 1 });
    }
    const dataset = options.dataset ?? extendedDatasets.first();
    const data = options.data ?? randomData(dataset.properties);
    const creator = options.creator ?? extendedUsers.first();
    const createdAt = !inPast
      ? new Date().toISOString()
      : fakePastDate([
        lastCreatedAt,
        creator.createdAt
      ]);
    return {
      uuid,
      currentVersion: { label, data, current: true, version },
      updates,
      creatorId: creator.id,
      creator: toActor(creator),
      createdAt,
      updatedAt
    };
  },
  sort: comparator((entity1, entity2) =>
    isBefore(entity2.createdAt, entity1.createdAt))
});

export const standardEntities = view(extendedEntities, omit(['creator']));

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
          updates: entity.updates,
          creatorId: entity.creator.id.toString(),
          creatorName: entity.creator.displayName,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
          version: entity.currentVersion.version
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
