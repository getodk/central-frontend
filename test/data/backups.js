import { DateTime } from 'luxon';

import BackupList from '../../lib/components/backup/list.vue';
import faker from '../faker';
import { MAXIMUM_TEST_DURATION } from '../util';
import { dataStore } from './data-store';

const store = dataStore({
  id: false,
  createdAt: false,
  updatedAt: false,
  factory: () => {
    const recentDate = BackupList.methods.recentDate();
    // The earliest time, for testing purposes, for backups to have been
    // configured.
    const setAtFloor = DateTime
      .local()
      .minus({ milliseconds: 10 * (Date.now() - recentDate.getTime()) })
      .toJSDate();
    // Returns a random time for backups to have been configured.
    const fakeSetAt = (isRecent) => {
      if (isRecent) {
        const sinceString = DateTime
          .fromJSDate(recentDate)
          // Adding this duration to ensure that the resulting date is
          // considered recent throughout the test.
          .plus(MAXIMUM_TEST_DURATION)
          .toISO();
        return faker.date.pastSince(sinceString);
      }
      return faker.date.between(
        setAtFloor.toISOString(),
        DateTime.fromJSDate(recentDate).minus({ milliseconds: 1 }).toISO()
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
        const loggedAtFloor = previousSetAt >= recentDate
          ? previousSetAt
          : recentDate;
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
});

// eslint-disable-next-line import/prefer-default-export
export const backups = store;
