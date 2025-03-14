import type { Owner } from 'solid-js';
import { getOwner } from 'solid-js';
import { MISSING_RESOURCE_BEHAVIOR } from '../client/constants.ts';
import type { FormResource } from '../client/form/FormResource.ts';
import type { LoadForm, LoadFormOptions } from '../client/form/LoadForm.ts';
import type { LoadFormResult } from '../client/form/LoadFormResult.ts';
import { LoadFormFailureError } from '../error/LoadFormFailureError.ts';
import { retrieveFormDefinition } from '../instance/resource.ts';
import type { ReactiveScope } from '../lib/reactivity/scope.ts';
import { createReactiveScope } from '../lib/reactivity/scope.ts';
import { XFormDOM } from '../parse/XFormDOM.ts';
import { XFormDefinition } from '../parse/XFormDefinition.ts';
import { SecondaryInstancesDefinition } from '../parse/model/SecondaryInstance/SecondaryInstancesDefinition.ts';
import { FormFailureResult } from './FormResult/FormFailureResult.ts';
import { FormSuccessResult } from './FormResult/FormSuccessResult.ts';

/**
 * Creates a {@link ReactiveScope | reactive scope} from which all form
 * instances derive, and:
 *
 * - if a client loads a form within a Solid reactive context, the scope will be
 *   disposed along with the client's reactive context; OR
 * - if a client loads a form outside a Solid reactive context (typically: if a
 *   client does not use Solid reactivity), the scope will disposed if and when
 *   the engine drops access to the loaded form
 *
 * **IMPORTANT:** this **MUST** be called synchronously. If it is called in an
 * `async` function, it **MUST** be called before any `await` expression; if it
 * is called in any other flow with mixed synchrony, it must be called before
 * yielding to the event loop. Failing to do this will cause the engine to lose
 * access to a client's Solid reactive context, potentially leaking form
 * reactivity indefinitely.
 */
const createPotentiallyClientOwnedReactiveScope = (): ReactiveScope => {
	/**
	 * A {@link clientOwner | client owner} is the owner of a client's Solid
	 * reactive context, if one exists. If none exists, the {@link ReactiveScope}
	 * is fully owned by the engine.
	 */
	const clientOwner: Owner | null = getOwner();

	return createReactiveScope({ owner: clientOwner });
};

type GlobalFetch = typeof globalThis.fetch;

type UnboundGlobalFetch = (this: void, ...args: Parameters<GlobalFetch>) => ReturnType<GlobalFetch>;

/**
 * @see {@link https://github.com/getodk/web-forms/pull/281}
 */
let unboundGlobalFetch: UnboundGlobalFetch;

if (typeof globalThis.fetch === 'function') {
	unboundGlobalFetch = (...args) => {
		return globalThis.fetch(...args);
	};
} else {
	unboundGlobalFetch = () => {
		throw new Error('fetch is not supported in this environment');
	};
}

interface ResolvedOptions extends Required<LoadFormOptions> {}

/**
 * Resolves {@link FormResultLoadOptions} from options directly passed by a
 * client (if passed at all).
 *
 * Note that this function exists to be more resilient than the static types
 * would technically require, i.e. anticipating any kind of nullish value where
 * option properties are typed only as optional. This is an acknowledgement that
 * the nuances of nullishness are a footgun in untyped JavaScript, and
 * nested-optional semantics are a particularly likely source of mistakes in
 * client, and especially host application, integrations.
 */
const resolveOptions = (options?: LoadFormOptions): ResolvedOptions => {
	return {
		fetchFormDefinition: options?.fetchFormDefinition ?? unboundGlobalFetch,
		fetchFormAttachment: options?.fetchFormAttachment ?? unboundGlobalFetch,
		missingResourceBehavior: options?.missingResourceBehavior ?? MISSING_RESOURCE_BEHAVIOR.DEFAULT,
	};
};

/**
 * **IMPORTANT:** This function is defined separately from, and to be called by,
 * the {@link loadForm} entrypoint to ensure we satisfy the synchrony
 * requirements of {@link createPotentiallyClientOwnedReactiveScope}.
 */
const loadFormResult = async (
	scope: ReactiveScope,
	formResource: FormResource,
	options: ResolvedOptions
): Promise<LoadFormResult> => {
	const { fetchFormDefinition, fetchFormAttachment, missingResourceBehavior } = options;

	// TODO: Currently, **all** of the intermediate calls in this `try` block
	// may throw! Handling that fact at the source would provide a much more
	// specific `LoadFormFailureResult`, and address performance regressions
	// inherent to such a broad/mixed use of `try`/`catch`.
	//
	// Addressing this is deferred for now, to limit scope.
	try {
		const sourceXML = await retrieveFormDefinition(formResource, {
			fetchFormDefinition,
		});
		const xformDOM = XFormDOM.from(sourceXML);
		const { model } = new XFormDefinition(xformDOM);
		const secondaryInstances = await SecondaryInstancesDefinition.load(xformDOM, {
			fetchResource: fetchFormAttachment,
			missingResourceBehavior,
		});
		const instanceOptions = {
			scope,
			model,
			secondaryInstances,
		};

		return new FormSuccessResult({
			warnings: null,
			error: null,
			scope,
			formResource,
			instanceOptions,
		});
	} catch (caught) {
		let cause: Error;

		if (caught instanceof Error) {
			cause = caught;
		} else {
			cause = new Error('Unknown form load error', { cause: caught });
		}

		const error = new LoadFormFailureError(formResource, [cause]);

		return new FormFailureResult({
			warnings: null,
			error,
		});
	}
};

export const loadForm = (
	formResource: FormResource,
	options?: LoadFormOptions
): Promise<LoadFormResult> => {
	const scope = createPotentiallyClientOwnedReactiveScope();
	const resolvedOptions = resolveOptions(options);

	return loadFormResult(scope, formResource, resolvedOptions);
};

loadForm satisfies LoadForm;
