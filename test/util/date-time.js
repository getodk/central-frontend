import { faker } from '@faker-js/faker';
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

// setLuxon() sets one or more Luxon settings. It will restore the settings to
// their original values at the end of the test.
const originalSettings = new Map();
export const setLuxon = (settings) => {
  for (const [name, value] of Object.entries(settings)) {
    if (!originalSettings.has(name)) originalSettings.set(name, Settings[name]);
    setLuxonSetting(name, value);
  }
};
afterEach(() => {
  for (const [name, value] of originalSettings.entries())
    Settings[name] = value;
  originalSettings.clear();
});

// Returns an ISO string for a date in the past that is no earlier than the
// specified dates.
export const fakePastDate = (dateStrings) => {
  const parsed = dateStrings
    .filter(s => s != null)
    .map(s => Date.parse(s));
  if (parsed.length === 0) return faker.date.past().toISOString();
  const from = Math.max(...parsed);
  const to = Date.now() - 1000;
  if (from > to) {
    const json = JSON.stringify(dateStrings);
    const toAsString = new Date(to).toISOString();
    throw new Error(`one of the specified timestamps is later than the maximum allowed timestamp of ${toAsString}: ${json}`);
  }
  return faker.date.between({ from, to }).toISOString();
};
