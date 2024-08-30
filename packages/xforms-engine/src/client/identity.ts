type ODKXFormsUUID = `uuid:${string}`;

/**
 * @see {@link https://getodk.github.io/xforms-spec/#metadata}
 */
export type InstanceID = ODKXFormsUUID;

/**
 * @see {@link https://getodk.github.io/xforms-spec/#metadata}
 */
export type DeprecatedID = ODKXFormsUUID;

/**
 * Represents a session-stable identifier for any particular node i
 */
export type FormNodeID = `node:${string}`;
