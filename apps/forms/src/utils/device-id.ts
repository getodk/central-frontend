const DEVICE_ID_KEY = 'odk-deviceid';
const DEVICE_ID_PREFIX = 'wf';
const DEVICE_ID_LENGTH = 16;
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const getRandomId = () => {
  const bytes = new Uint8Array(DEVICE_ID_LENGTH);
  crypto.getRandomValues(bytes);
  const chars: string[] = [];
  for (const byte of bytes) {
    chars.push(ALPHABET[byte % ALPHABET.length]!);
  }
  return chars.join('');
};

export const getDeviceId = () => {
  const existingDeviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (existingDeviceId) {
    return existingDeviceId;
  }
  const deviceId = `${DEVICE_ID_PREFIX}:${getRandomId()}`;
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
};
