import type { loadForm } from '../../entrypoints/loadForm.ts';
import type { MissingResourceBehavior } from '../constants.ts';
import type { FetchFormAttachment, FetchResource } from '../resources.ts';
import type { FormResource } from './FormResource.ts';
import type { LoadFormFailureResult, LoadFormResult } from './LoadFormResult.ts';

/**
 * @see {@link LoadForm}
 */
export interface FormLoadPromise<T> extends PromiseLike<T> {}

/**
 * Any fetch-like {@link LoadFormOptions | form loading options} which are not
 * provided will default to the global {@link fetch} function, if one is
 * available in the calling environment. If a global {@link fetch} function is
 * _is not available_, and if the associated form loading option is required for
 * the provided {@link FormResource} to be loaded, a
 * {@link LoadFormFailureResult} will be produced.
 */
export type GlobalFetchDefault = typeof fetch;

export interface LoadFormOptions {
	/**
	 * A client may specify an arbitrary {@link fetch}-like function for
	 * retrieving an XML XForm form definition.
	 *
	 * Calls to {@link loadForm | load a form} from a form definition provided as
	 * either a raw XML string or {@link Blob} data containing an XML string, this
	 * option will be ignored.
	 *
	 * Calls to load a form by {@link URL} will consult this option, if defined.
	 *
	 * If this option is omitted, loading a form by URL will use the
	 * {@link GlobalFetchDefault | global fetch function} by default.
	 */
	readonly fetchFormDefinition?: FetchResource;

	/**
	 * A client may specify an arbitrary {@link fetch}-like function to retrieve a
	 * form's attachments, i.e. any `jr:` URL referenced by the form (as specified
	 * by {@link https://getodk.github.io/xforms-spec/ | ODK XForms}).
	 *
	 * As part of {@link loadForm | loading a form}, once the form definition
	 * itself is resolved, this option (if provided) will be consulted to load any
	 * form attachments referenced by the form definition.
	 *
	 * If this option is omitted, the engine will attempt to load form attachments
	 * by calling the {@link GlobalFetchDefault | global fetch function} with each
	 * attachment's `jr:` URL. This default behavior will typically result in
	 * failure to load form attachments—and in most cases this will in most cases
	 * cause {@link loadForm | loading a form} to produce a
	 * {@link LoadFormFailureResult}, with the following exception:
	 *
	 * Clients implementing a
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API | Service Worker}
	 * (e.g. supporting offline functionality, or any other use case for
	 * intercepting network requests) may opt for the convenience of handling
	 * network requests _for form attachments' `jr:` URLs_ along with any other
	 * network interception logic. Client implementors should be warned, however,
	 * that such `jr:` URLs are not namespaced or otherwise scoped to a particular
	 * form definition! Such a client would therefore inherently need to
	 * coordinate state between the Service Worker and the main thread (or
	 * whatever other realm calls {@link loadForm}).
	 *
	 * @todo We can almost certainly address the scoping caveat! We'll probably
	 * want to design for that as part of offline support.
	 */
	// TODO (internal): Also note that the current round of revisions to
	// engine/client entrypoints are not directly designed to address the above
	// `@todo`, but the offline use case in particular is very much in mind for
	// these interface changes!
	readonly fetchFormAttachment?: FetchFormAttachment;

	/**
	 * @see {@link MissingResourceBehavior}
	 * @see {@link MissingResourceBehaviorDefault}
	 *
	 * @default MissingResourceBehaviorDefault
	 */
	readonly missingResourceBehavior?: MissingResourceBehavior;
}

/**
 * Note: loading a form produce a {@link Promise} which **will never reject**.
 * Rather than rejecting, any errors encountered in the process of loading a
 * form will be **resolved**, in a
 * {@link LoadFormFailureResult.error | FormLoadFailureResult error}.
 */
export type LoadForm = (
	formResource: FormResource,
	options?: LoadFormOptions
) => FormLoadPromise<LoadFormResult>;
