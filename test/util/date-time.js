import faker from 'faker';
import { DateTime, Settings } from 'luxon';

export const isBefore = (isoString1, isoString2) =>
  DateTime.fromISO(isoString1) < DateTime.fromISO(isoString2);

// Sets a single Luxon setting.
const setLuxonSetting = (name, value) => {
  if (name === 'now') {
    if (typeof value === 'number') {
      Settings[name] = () => value;
    } else if (typeof value === 'string') {
      const millis = DateTime.fromISO(value).toMillis();
      Settings[name] = () => millis;
    } else if (value instanceof DateTime) {
      Settings[name] = () => value.toMillis();
    } else {
      Settings[name] = value;
    }
  } else {
    Settings[name] = value;
  }
};

// Sets one or more Luxon settings.
export const setLuxon = (settings) => {
  const original = {};
  for (const [name, value] of Object.entries(settings)) {
    original[name] = Settings[name];
    setLuxonSetting(name, value);
  }
  return () => setLuxon(original);
};

// Returns an ISO string for a date in the past that is no earlier than the
// specified dates.
export const fakePastDate = (dateStrings) => {
  const dateTimes = dateStrings
    .filter(s => s != null)
    .map(s => DateTime.fromISO(s));
  if (dateTimes.length === 0) return faker.date.past().toISOString();
  const maxDate = DateTime.max(...dateTimes).toJSDate();
  const almostNow = new Date();
  almostNow.setTime(almostNow.getTime() - 1000);
  if (maxDate.getTime() > almostNow.getTime())
    throw new Error('invalid dateStrings');
  return faker.date
    .between(maxDate.toISOString(), almostNow.toISOString())
    .toISOString();
};
