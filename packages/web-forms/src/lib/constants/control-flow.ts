/**
 * Sentinel value, which may be used by a host application, once it has handled
 * submission of a form instance, indicating that Web Forms should create a new
 * instance of the currently loaded form.
 */
// In other words, if we get this from a host app like Central, we call
// `form.createInstance()` and replace the current form's instance state with
// the newly created instance.
export const POST_SUBMIT__NEW_INSTANCE = Symbol('POST_SUBMIT__NEW_INSTANCE');
export type POST_SUBMIT__NEW_INSTANCE = typeof POST_SUBMIT__NEW_INSTANCE;
