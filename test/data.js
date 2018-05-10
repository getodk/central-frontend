/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import moment from 'moment';

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
      active: (fieldKey) => fieldKey.token != null,
      revoked: (fieldKey) => fieldKey.token == null
    },
    sort: (fieldKey1, fieldKey2) => {
      const isRevoked1 = fieldKey1.token == null;
      const isRevoked2 = fieldKey2.token == null;
      if (isRevoked1 !== isRevoked2) {
        if (isRevoked1) return 1;
        if (isRevoked2) return -1;
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
    factory: () => {
      const xmlFormId = `a${faker.random.alphaNumeric(8)}`;
      const name = faker.random.arrayElement([faker.name.findName(), null]);
      const anySubmission = faker.random.boolean();
      const version = faker.random.arrayElement([faker.random.number(), null]);
      return {
        xmlFormId,
        name,
        version,
        // This does not actually match the XML below.
        hash: faker.random.number({ max: (16 ** 32) - 1 }).toString(16).padStart('0'),
        submissions: anySubmission ? faker.random.number({ min: 1 }) : 0,
        lastSubmission: anySubmission ? faker.date.past().toISOString() : null,
        createdBy: pick(
          testData.administrators.randomOrCreatePast(),
          ['id', 'displayName', 'meta', 'createdAt', 'updatedAt']
        ),
        xml: `<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>${name}</h:title>
    <model>
      <instance>
        <data id="${xmlFormId}"${version != null ? ` version="${version}"` : ''}>
          <meta>
            <instanceID/>
          </meta>
          <name/>
          <age/>
        </data>
      </instance>

      <bind nodeset="/data/meta/instanceID" type="string" readonly="true()" calculate="concat('uuid:', uuid())"/>
      <bind nodeset="/data/name" type="string"/>
      <bind nodeset="/data/age" type="int"/>
    </model>

  </h:head>
  <h:body>
    <input ref="/data/name">
      <label>What is your name?</label>
    </input>
    <input ref="/data/age">
      <label>What is your age?</label>
    </input>
  </h:body>
</h:html>`
      };
    },
    validate: [
      validateUniqueCombination(['xmlFormId']),
      validateDateOrder('createdBy.createdAt', 'createdAt'),
      validateDateOrder('createdAt', 'lastSubmission')
    ],
    constraints: {
      withName: (form) => form.name != null
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
    factory: () => {
      const form = testData.extendedForms.randomOrCreatePast();
      const instanceId = faker.random.uuid();
      return {
        formId: form.id,
        instanceId,
        xml: `<data id="${form.id}"><orx:meta><orx:instanceID>${instanceId}</orx:instanceID></orx:meta><name>Alice</name><age>30</age></data>`,
        submitter: pick(
          testData.administrators.randomOrCreatePast(),
          ['id', 'displayName', 'meta', 'createdAt', 'updatedAt']
        )
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
