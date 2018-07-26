/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import moment from 'moment';
import { DateTime } from 'luxon';

import BackupList from '../lib/components/backup/list.vue';
import faker from './faker';
import { MAXIMUM_TEST_DURATION } from './util';
import { dataStore, resetDataStores } from './data-store';



////////////////////////////////////////////////////////////////////////////////
// UTILITIES

const pathValue = (object, path) => {
  let node = object;
  for (const name of path.split('.')) {
    if (node == null) return undefined;
    node = node[name];
  }
  return node;
};

const pick = (object, propertyNames) => {
  const result = {};
  for (const name of propertyNames) {
    if (!(name in object)) throw new Error('property is not in object');
    result[name] = object[name];
  }
  return result;
};

const omit = (object, propertyNames) => {
  const result = Object.assign({}, object);
  for (const name of propertyNames)
    delete result[name];
  return result;
};



////////////////////////////////////////////////////////////////////////////////
// VALIDATORS

const validateDateOrder = (path1, path2) => (object) => {
  const date1 = pathValue(object, path1);
  if (date1 == null) return true;
  const date2 = pathValue(object, path2);
  return date2 == null || date1 <= date2;
};

const validateUniqueCombination = (propertyNames) => (object, store) => {
  for (let i = 0; i < store.size; i += 1) {
    if (propertyNames.every(name => object[name] === store.get(i)[name]))
      return false;
  }
  return true;
};



////////////////////////////////////////////////////////////////////////////////
// SORT

const sortByUpdatedAtOrCreatedAtDesc = (object1, object2) => {
  const time1 = object1.updatedAt != null ? object1.updatedAt : object1.createdAt;
  const time2 = object2.updatedAt != null ? object2.updatedAt : object2.createdAt;
  if (time1 < time2)
    return 1;
  else if (time1 === time2)
    return -1;
  return 0;
};



////////////////////////////////////////////////////////////////////////////////
// TEST DATA

const testData = Object.assign(
  {},

  dataStore({
    name: 'administrators',
    factory: () => ({
      displayName: faker.name.findName(),
      email: faker.internet.email(),
      meta: null
    }),
    validate: [
      validateUniqueCombination(['email'])
    ],
    sort: 'email'
  }),

  dataStore({
    name: 'sessions',
    id: false,
    updatedAt: false,
    factory: () => ({
      token: faker.app.token(),
      expiresAt: faker.date.future().toISOString()
    })
  }),

  dataStore({
    name: 'extendedFieldKeys',
    factory: () => ({
      displayName: faker.name.findName(),
      token: faker.random.arrayElement([faker.app.token(), null]),
      meta: null,
      lastUsed: faker.random.arrayElement([faker.date.past().toISOString(), null]),
      createdBy: pick(
        testData.administrators.randomOrCreatePast(),
        ['id', 'displayName', 'meta', 'createdAt', 'updatedAt']
      )
    }),
    validate: [
      validateDateOrder('createdBy.createdAt', 'createdAt'),
      validateDateOrder('createdAt', 'lastUsed')
    ],
    constraints: {
      withAccess: (fieldKey) => fieldKey.token != null,
      withAccessRevoked: (fieldKey) => fieldKey.token == null
    },
    sort: (fieldKey1, fieldKey2) => {
      const accessRevoked1 = fieldKey1.token == null;
      const accessRevoked2 = fieldKey2.token == null;
      if (accessRevoked1 !== accessRevoked2) {
        if (accessRevoked1) return 1;
        if (accessRevoked2) return -1;
      }
      if (fieldKey1.createdAt < fieldKey2.createdAt)
        return 1;
      else if (fieldKey1.createdAt > fieldKey2.createdAt)
        return -1;
      return 0;
    },
    views: {
      simpleFieldKeys: (extendedFieldKey) => {
        const fieldKey = omit(extendedFieldKey, ['lastUsed']);
        fieldKey.createdBy = fieldKey.createdBy.id;
        return fieldKey;
      }
    }
  }),

  dataStore({
    name: 'extendedForms',
    factory: ({ hasInstanceId = faker.random.boolean() }) => {
      const xmlFormId = `a${faker.random.alphaNumeric(8)}`;
      const name = faker.random.arrayElement([faker.name.findName(), null]);
      const anySubmission = faker.random.boolean();
      const version = faker.random.boolean() ? faker.random.number().toString() : '';
      const instanceId = [];
      if (hasInstanceId) {
        instanceId.push({
          path: faker.random.boolean() ? ['meta', 'instanceID'] : ['instanceID'],
          type: 'string'
        });
      }
      return {
        xmlFormId,
        name,
        version,
        state: faker.random.arrayElement(['open', 'closing', 'closed']),
        hash: faker.random.number({ max: (16 ** 32) - 1 }).toString(16).padStart('0'),
        // The following two properties do not necessarily match
        // testData.extendedSubmissions.
        submissions: anySubmission ? faker.random.number({ min: 1 }) : 0,
        lastSubmission: anySubmission ? faker.date.past().toISOString() : null,
        createdBy: pick(
          testData.administrators.randomOrCreatePast(),
          ['id', 'displayName', 'meta', 'createdAt', 'updatedAt']
        ),
        // We currently do not use the XML anywhere. If/when we do, we should
        // consider whether to keep it in sync with the hash and _schema
        // properties.
        xml: '',
        _schema: [
          ...instanceId,
          { path: ['testInt'], type: 'int' },
          { path: ['testDecimal'], type: 'decimal' },
          { path: ['testDate'], type: 'date' },
          { path: ['testTime'], type: 'time' },
          { path: ['testDateTime'], type: 'dateTime' },
          { path: ['testGeopoint'], type: 'geopoint' },
          { path: ['testGroup', 'testBinary'], type: 'binary' },
          { path: ['testBranch'] },
          { path: ['testString1'], type: 'string' },
          { path: ['testString2'], type: 'string' },
          { path: ['testString3'], type: 'string' },
          {
            path: ['testRepeat'],
            type: 'repeat',
            children: [
              { path: ['testString4'], type: 'string' }
            ]
          }
        ]
      };
    },
    validate: [
      validateUniqueCombination(['xmlFormId']),
      validateDateOrder('createdBy.createdAt', 'createdAt'),
      validateDateOrder('createdAt', 'lastSubmission')
    ],
    constraints: {
      withName: (form) => form.name != null,
      open: (form) => form.state === 'open',
      notOpen: (form) => form.state !== 'open',
      withSubmission: (form) => form.submissions !== 0,
      withoutSubmission: (form) => form.submissions === 0
    },
    sort: sortByUpdatedAtOrCreatedAtDesc,
    views: {
      simpleForms: (extendedForm) => {
        const form = omit(extendedForm, ['lastSubmission', 'submissions']);
        form.createdBy = form.createdBy.id;
        return form;
      }
    }
  }),

  dataStore({
    name: 'extendedSubmissions',
    factory: ({
      createdAt,

      hasInt = faker.random.boolean(),
      hasDecimal = faker.random.boolean(),
      hasStrings = faker.random.boolean(),
      hasDate = faker.random.boolean(),
      hasTime = faker.random.boolean(),
      hasDateTime = faker.random.boolean(),
      hasGeopoint = faker.random.boolean(),
      hasBinary = faker.random.boolean(),

      ...partialOData
    }) => {
      const form = testData.extendedForms.randomOrCreatePast();
      const instanceId = faker.random.uuid();
      const submitter = testData.administrators.randomOrCreatePast();

      const oData = {
        ...partialOData,
        __id: instanceId,
        __system: {
          submissionDate: createdAt,
          submitterId: submitter.id.toString(),
          submitterName: submitter.displayName
        }
      };
      const pastDateTime = (formatString) => {
        const dateTime = DateTime.fromJSDate(faker.date.past());
        const formatted = dateTime.toFormat(formatString);
        if (faker.random.boolean()) return formatted;
        return `${formatted}+0100`;
      };
      const schemaInstanceId = form._schema.find(question => {
        const { path } = question;
        return (path.length === 2 && path[0] === 'meta' && path[1] === 'instanceID') ||
          (path.length === 1 && path[0] === 'instanceID');
      });
      if (schemaInstanceId != null) {
        if (schemaInstanceId.length === 1) {
          if (oData.instanceID == null) oData.instanceID = instanceId;
        } else {
          if (oData.meta == null) oData.meta = {};
          if (oData.meta.instanceID == null) oData.meta.instanceID = instanceId;
        }
      }
      if (oData.testInt == null && hasInt)
        oData.testInt = faker.random.number();
      if (oData.testDecimal == null && hasDecimal)
        oData.testDecimal = faker.random.number({ precision: 0.00001 });
      if (oData.testDate == null && hasDate)
        oData.testDate = pastDateTime('yyyy-MM-dd');
      if (oData.testTime == null && hasTime)
        oData.testTime = pastDateTime('HH:mm:ss');
      if (oData.testDateTime == null && hasDateTime)
        oData.testDateTime = pastDateTime('yyyy/MM/dd HH:mm:ss');
      if (oData.testGeopoint == null && hasGeopoint) {
        const coordinates = [
          faker.random.number({ min: -85, max: 85, precision: 0.0000000001 }),
          faker.random.number({ min: -180, max: 180, precision: 0.0000000001 })
        ];
        if (faker.random.boolean()) coordinates.push(faker.random.number());
        oData.testGeopoint = { type: 'Point', coordinates };
      }
      if (oData.testGroup == null) oData.testGroup = {};
      if (oData.testGroup.testBinary == null && hasBinary)
        oData.testGroup.testBinary = faker.system.commonFileName('.jpg');
      oData.testBranch = faker.random.boolean() ? 'y' : 'n';
      if (hasStrings) {
        for (let i = 1; i <= 3; i += 1) {
          const name = `testString${i}`;
          if (oData[name] == null) {
            const count = faker.random.number({ min: 1, max: 3 });
            oData[name] = faker.lorem.paragraphs(count);
          }
        }
      }
      // Once we resolve issue #82 for Backend, we should add a repeat group to
      // the data.

      return {
        formId: form.id,
        instanceId,
        // We currently do not use the XML anywhere. If/when we do, we should
        // consider whether to keep it in sync with the _oData property.
        xml: '',
        submitter: pick(
          submitter,
          ['id', 'displayName', 'meta', 'createdAt', 'updatedAt']
        ),
        _oData: oData
      };
    },
    validate: [
      validateUniqueCombination(['formId', 'instanceId']),
      validateDateOrder('submitter.createdAt', 'createdAt')
    ],
    sort: sortByUpdatedAtOrCreatedAtDesc
  }),

  dataStore({
    name: 'backups',
    id: false,
    createdAt: false,
    updatedAt: false,
    factory: () => {
      const recentDate = BackupList.methods.recentDate();
      // The earliest time, for testing purposes, for backups to have been
      // configured.
      const setAtFloor = moment()
        .subtract(10 * moment().diff(moment(recentDate)), 'milliseconds')
        .toDate();
      // Returns a random time for backups to have been configured.
      const fakeSetAt = (isRecent) => {
        if (isRecent) {
          const sinceString = moment(recentDate)
            // Adding this duration to ensure that the resulting date is
            // considered recent throughout the test.
            .add(MAXIMUM_TEST_DURATION)
            .toISOString();
          return faker.date.pastSince(sinceString);
        }
        return faker.date.between(
          setAtFloor.toISOString(),
          moment(recentDate).subtract(1, 'millisecond').toISOString()
        );
      };
      // Returns a backup attempt (an audit log).
      const attempt = ({ success, loggedAt, configSetAt }) => {
        const details = { success };
        if (success)
          details.configSetAt = configSetAt.toISOString();
        else {
          const error = new Error('error');
          Object.assign(details, { message: error.message, stack: error.stack });
        }
        return {
          actorId: null,
          action: 'backup',
          acteeId: null,
          details,
          loggedAt: loggedAt.toISOString()
        };
      };
      // Returns a backups response.
      const backups = ({ recentlySetUp, mostRecentAttempt }) => {
        const setAt = fakeSetAt(recentlySetUp);
        const recent = [];
        if (mostRecentAttempt != null) {
          const loggedAtFloor = recentlySetUp ? setAt : recentDate;
          recent.push(attempt({
            success: mostRecentAttempt.success,
            loggedAt: faker.date.pastSince(loggedAtFloor),
            configSetAt: setAt
          }));
          // 50% of the time, we add an earlier backup attempt to `recent`.
          if (faker.random.boolean()) {
            recent.push(attempt({
              success: faker.random.boolean(),
              loggedAt: faker.date.between(
                loggedAtFloor.toISOString(),
                recent[0].loggedAt
              ),
              configSetAt: setAt
            }));
          }
        }
        // Possibly add a backup attempt to `recent` from an earlier config.
        if (recentlySetUp && faker.random.boolean()) {
          const previousSetAt = faker.date.between(
            setAtFloor.toISOString(),
            setAt.toISOString()
          );
          const loggedAtFloor = moment
            .max(moment(previousSetAt), moment(recentDate))
            .toDate();
          recent.push(attempt({
            success: true,
            loggedAt: faker.date.between(
              loggedAtFloor.toISOString(),
              setAt.toISOString()
            ),
            configSetAt: previousSetAt
          }));
        }
        return {
          type: 'google',
          setAt: setAt.toISOString(),
          recent
        };
      };
      return faker.random.arrayElement([
        backups({ recentlySetUp: true, mostRecentAttempt: null }),
        backups({ recentlySetUp: false, mostRecentAttempt: null }),
        backups({
          recentlySetUp: faker.random.boolean(),
          mostRecentAttempt: {
            success: true
          }
        }),
        backups({
          recentlySetUp: faker.random.boolean(),
          mostRecentAttempt: {
            success: false
          }
        })
      ]);
    },
    constraints: {
      recentlySetUp: (backups) =>
        new Date(backups.setAt) >= BackupList.methods.recentDate(),
      notRecentlySetUp: (backups) =>
        new Date(backups.setAt) < BackupList.methods.recentDate(),
      noRecentAttempt: (backups) =>
        BackupList.methods.recentForConfig(backups).length === 0,
      mostRecentAttemptWasSuccess: (backups) => {
        const recent = BackupList.methods.recentForConfig(backups);
        return recent.length !== 0 && recent[0].details.success;
      },
      mostRecentAttemptWasFailure: (backups) => {
        const recent = BackupList.methods.recentForConfig(backups);
        return recent.length !== 0 && !recent[0].details.success;
      }
    }
  })
);

testData.reset = resetDataStores;

export default testData;
