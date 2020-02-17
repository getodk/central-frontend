import { DateTime, Settings } from 'luxon';

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
// eslint-disable-next-line import/prefer-default-export
export const setLuxon = (settings) => {
  const original = {};
  for (const [name, value] of Object.entries(settings)) {
    original[name] = Settings[name];
    setLuxonSetting(name, value);
  }
  return () => setLuxon(original);
};
