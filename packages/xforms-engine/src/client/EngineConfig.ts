import type { initializeForm } from '../instance/index.ts';
import type { MissingResourceBehavior, MissingResourceBehaviorDefault } from './constants.ts';
import type { OpaqueReactiveObjectFactory } from './OpaqueReactiveObjectFactory.ts';
import type { FetchFormAttachment, FetchResource } from './resources.ts';

/**
 * Options provided by a client to specify certain aspects of engine runtime
 * behavior. These options will generally be intended to facilitate cooperation
 * where there is mixed responsibility between a client and the engine, or where
 * the engine may provide sensible defaults which a client could be expected to
 * override or augment.
 */
export interface EngineConfig {
	/**
	 * A client may specify a generic function for constructing stateful objects.
	 * The only hard requirement of this function is that it accepts an **object**
	 * and returns an object of the same shape. The engine will use this function
	 * to initialize client-facing state, and will mutate properties of the object
	 * when their corresponding state is changed.
	 *
	 * A client may use this function to provide its own implementation of
	 * reactivity with semantics like those described above. The mechanism of
	 * reactivity, if any, is at the discretion of the client. It is expected
	 * that clients providing this function will use a reactive subscribe-on-read
	 * mechanism to handle state updates conveyed by the engine.
	 */
	readonly stateFactory?: OpaqueReactiveObjectFactory;

	/**
	 *
	 * A client may specify an arbitrary {@link fetch}-like function for retrieving an XML XForm form
	 * definition.
	 *
	 * Notes:
	 *
	 * - This configuration will only be consuled for calls to
	 *   {@link initializeForm} with a URL referencing an XML XForm definition. It
	 *   will be ignored for calls passing an XML XForm form definition directly.
	 *
	 * - For calls to {@link initializeForm} with a URL, if this configuration is
	 *   not specified it will default to the global {@link fetch} function (if
	 *   one is defined).
	 */
	readonly fetchFormDefinition?: FetchResource;

	/**
	 * @deprecated
	 * @alias fetchFormDefinition
	 */
	readonly fetchResource?: FetchResource;

	/**
	 * A client may specify an arbitrary {@link fetch}-like function to retrieve a
	 * form's attachments, i.e. any `jr:` URL referenced by the form (as specified
	 * by {@link https://getodk.github.io/xforms-spec/ | ODK XForms}).
	 *
	 * Notes:
	 *
	 * - This configuration will be consulted for all supported form attachments,
	 *   as a part of {@link initializeForm | form initialization}.
	 *
	 * - If this configuration is not specified it will default to the global
	 *   {@link fetch} function (if one is defined).
	 *
	 * This default behavior will typically result in failure to load form
	 * attachments—and in most cases this will also cause
	 * {@link initializeForm | form initialization} to fail overall—with the
	 * following exceptions:
	 *
	 * - **CLIENT-SPECIFIC:** Usage in coordination with a client-implemented
	 *   {@link https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API | Serivce Worker},
	 *   which can intercept network requests **generally**. Clients already using
	 *   a Service Worker may opt for the convenience of handling network requests
	 *   for `jr:` URLs along with any other network interception logic. Client
	 *   implementors should be warned, however, that such `jr:` URLs are not
	 *   namespaced or otherwise scoped to a particular form; such a client would
	 *   therefore inherently need to coordinate state between the Service Worker
	 *   and the main thread (or whatever other realm calls
	 *   {@link initializeForm}).
	 */
	readonly fetchFormAttachment?: FetchFormAttachment;

	/**
	 * @see {@link MissingResourceBehavior}
	 * @see {@link MissingResourceBehaviorDefault}
	 *
	 * @default MissingResourceBehaviorDefault
	 */
	readonly missingResourceBehavior?: MissingResourceBehavior;
}
