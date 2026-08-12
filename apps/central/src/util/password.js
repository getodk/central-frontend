export async function checkPasswordPwnage(request, password) { // eslint-disable-line import/prefer-default-export
  const hash = await sha1hash(password); // eslint-disable-line no-use-before-define

  const hashPrefix = hash.substring(0, 5);
  const hashSuffix = hash.substring(5);

  const suffixes = await getSuffixesFor(request, hashPrefix); // eslint-disable-line no-use-before-define

  return suffixes.includes(hashSuffix);
}

// from: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
async function sha1hash(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

async function getSuffixesFor(request, prefix) {
  try {
    const url = `https://api.pwnedpasswords.com/range/${prefix}`;
    const res = await request({ url });
    return res.data.split('\n').map(line => line.split(':')[0]);
  } catch (err) {
    console.log('pwned check failed:', err); // eslint-disable-line no-console
    // if we can't check, just let them use it
    return [];
  }
}
