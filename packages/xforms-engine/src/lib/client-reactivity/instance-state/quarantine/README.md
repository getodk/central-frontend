# Encryption

> [!CAUTION]
> Custom encryption is a bad idea. Do not use this unless absolutely necessary.

> [!CAUTION]
> Modification of this code requires great care as a bug in the encryption algorithm will make submissions unrecoverable.

The code in this directory implements the [ODK Spec](https://getodk.github.io/xforms-spec/encryption) which is very particular about how it's done so as to be compatible with other implementations.

## Implementation

The symmetric encryption parts of the spec are implemented using CryptoJS because the particular algorithm required by the spec is not supported by Subtle Crypto, and we use CryptoJS elsewhere.

The asymmetric components of the spec are implemented using the [Subtle Crypto web spec](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) because CryptoJS doesn't implement asymmetric encryption.
