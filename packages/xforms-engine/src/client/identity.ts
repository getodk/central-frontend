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

/**
 * Identifies one page of a form that declares `<h:body class="pages">`.
 *
 * A page is named by the {@link FormNodeID} of the node that defines it; either a `field-list` container holding
 * several controls, or a single control that stands alone on its own page.
 *
 * To show one page at a time, a client renders only the controls whose `pageBoundary` matches the root's `currentPage`.
 */
export type PageBoundary = FormNodeID;
