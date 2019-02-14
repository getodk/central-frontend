import { DateTime } from 'luxon';

import BackupList from '../../lib/components/backup/list.vue';
import faker from '../faker';
import { dataStore } from './data-store';

// In the functions that follow, date parameters expect Date values, not
// DateTime or String.

// Returns a random value of setAt for the current backups config, as a Date.
const fakeSetAt = ({ recentlySetUp, setAtFloor, recentDate }) => {
  if (recentlySetUp) return faker.date.pastSince(recentDate.toISOString());
  return faker.date.between(
    setAtFloor.toISOString(),
    DateTime.fromJSDate(recentDate).minus({ milliseconds: 1 }).toISO()
  );
};
// Returns a backup attempt (an audit log entry).
const attempt = ({ success, loggedAt, configSetAt }) => {
  const details = { success };
  if (success) {
    details.configSetAt = configSetAt.toISOString();
  } else {
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
// Returns a random array of recent backup attempts.
const fakeRecent = ({
  recentlySetUp,
  setAtFloor,
  recentDate,
  setAt,
  latestRecentAttempt,
  latestRecentAttemptForPrevious
}) => {
  const recent = [];

  if (latestRecentAttempt != null) {
    const loggedAtFloor = recentlySetUp ? setAt : recentDate;
    recent.push(attempt({
      success: latestRecentAttempt.success,
      loggedAt: faker.date.pastSince(loggedAtFloor),
      configSetAt: setAt
    }));
    // 50% of the time, we add a second, earlier backup attempt for the current
    // config.
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

  if (latestRecentAttemptForPrevious != null) {
    const previousSetAt = faker.date.between(
      setAtFloor.toISOString(),
      setAt.toISOString()
    );
    const loggedAtFloor = previousSetAt >= recentDate
      ? previousSetAt
      : recentDate;
    recent.push(attempt({
      success: latestRecentAttemptForPrevious.success,
      loggedAt: faker.date.between(
        loggedAtFloor.toISOString(),
        setAt.toISOString()
      ),
      configSetAt: previousSetAt
    }));
  }

  return recent;
};

// eslint-disable-next-line import/prefer-default-export
export const backups = dataStore({
  // The factory does not use createdAt, so createPast() and createNew() should
  // return similar results.
  factory: ({
    recentlySetUp = faker.random.boolean(),
    // Indicates whether there has been a recent backup attempt for the current
    // config and if so, whether the latest recent attempt was successful.
    latestRecentAttempt = faker.random.arrayElement([
      { success: true },
      { success: false },
      null
    ]),
    // Indicates whether there was a recent backup attempt for a previous config
    // and if so, whether the latest such attempt was successful.
    latestRecentAttemptForPrevious = recentlySetUp && faker.random.boolean()
      // Specifying `true` rather than faker.random.boolean() for backward
      // compatibility, though it may be that no test actually assumes that
      // `success` cannot be `false`.
      ? { success: true }
      : null
  }) => {
    const recentDate = BackupList.methods.recentDate();
    // The earliest time, for testing purposes, for backups to have been
    // configured.
    const setAtFloor = DateTime
      .local()
      .minus({ milliseconds: 10 * (Date.now() - recentDate.getTime()) })
      .toJSDate();
    const setAt = fakeSetAt({ recentlySetUp, setAtFloor, recentDate });
    return {
      type: 'google',
      setAt: setAt.toISOString(),
      recent: fakeRecent({
        recentlySetUp,
        setAtFloor,
        recentDate,
        setAt,
        latestRecentAttempt,
        latestRecentAttemptForPrevious
      })
    };
  }
});
