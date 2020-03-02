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
