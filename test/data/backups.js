import { DateTime } from 'luxon';

import BackupsConfig from '../../src/presenters/backups-config';
import faker from '../faker';
import { extendedAudits } from './audits';
import { dataStore } from './data-store';

const fakeRecentAttemptsForCurrent = () => {
  const attempts = [];
  const count = faker.random.number({ max: 2 });
  for (let i = 0; i < count; i += 1)
    attempts.push(faker.random.boolean());
  return attempts;
};

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
  return extendedAudits
    .createPast(1, {
      actor: null,
      action: 'backup',
      actee: null,
      details,
      loggedAt: loggedAt.toISOString()
    })
    .last();
};

// Returns a random array of recent backup attempts.
const fakeRecent = ({
  recentlySetUp,
  setAtFloor,
  recentDate,
  setAt,
  recentAttemptsForCurrent,
  recentAttemptsForPrevious
}) => {
  const recent = [];

  // Add attempts for a single previous config.
  if (recentAttemptsForPrevious.length !== 0) {
    const previousSetAt = faker.date.between(
      setAtFloor.toISOString(),
      setAt.toISOString()
    );
    let loggedAtFloor = previousSetAt >= recentDate
      ? previousSetAt.toISOString()
      : recentDate.toISOString();
    for (const success of recentAttemptsForPrevious) {
      recent.unshift(attempt({
        success,
        loggedAt: faker.date.between(loggedAtFloor, setAt.toISOString()),
        configSetAt: previousSetAt
      }));
      loggedAtFloor = recent[0].loggedAt;
    }
  }

  // Add attempts for the current config.
  let loggedAtFloor = recentlySetUp // eslint-disable-line no-nested-ternary
    ? setAt.toISOString()
    : (recent.length !== 0 ? recent[0].loggedAt : recentDate.toISOString());
  for (const success of recentAttemptsForCurrent) {
    recent.unshift(attempt({
      success,
      loggedAt: faker.date.pastSince(loggedAtFloor),
      configSetAt: setAt
    }));
    loggedAtFloor = recent[0].loggedAt;
  }

  return recent;
};

// eslint-disable-next-line import/prefer-default-export
export const backups = dataStore({
  factory: ({
    inPast,

    recentlySetUp = !inPast || faker.random.boolean(),

    // An array with an element for each recent backup attempt for the current
    // config. The element is boolean, indicating whether the attempt was
    // successful.
    recentAttemptsForCurrent = inPast ? fakeRecentAttemptsForCurrent() : [],
    recentAttemptsForPrevious = recentlySetUp && faker.random.boolean()
      // Specifying [true] rather than [faker.random.boolean()] for backward
      // compatibility, though it may be that no test actually assumes that this
      // attempt was successful.
      ? [true]
      : []
  }) => {
    const recentDate = BackupsConfig.recentDateTime().toJSDate();
    // The earliest time, for testing purposes, for backups to have been
    // configured.
    const setAtFloor = DateTime
      .local()
      .minus({ milliseconds: 10 * (Date.now() - recentDate.getTime()) })
      .toJSDate();
    const setAt = inPast
      ? fakeSetAt({ recentlySetUp, setAtFloor, recentDate })
      : new Date();
    return {
      type: 'google',
      setAt: setAt.toISOString(),
      recent: fakeRecent({
        recentlySetUp,
        setAtFloor,
        recentDate,
        setAt,
        recentAttemptsForCurrent,
        recentAttemptsForPrevious
      })
    };
  }
});
