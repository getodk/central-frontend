import { MISSING_RESOURCE_BEHAVIOR } from '../client/constants.ts';
import type { FormResource } from '../client/form/FormResource.ts';
import type { LoadForm, LoadFormOptions } from '../client/form/LoadForm.ts';
import type { LoadFormResult } from '../client/form/LoadFormResult.ts';
import { LoadFormFailureError } from '../error/LoadFormFailureError.ts';
import { retrieveFormDefinition } from '../instance/resource.ts';
import type { ReactiveScope } from '../lib/reactivity/scope.ts';
import { XFormDOM } from '../parse/XFormDOM.ts';
import { XFormDefinition } from '../parse/XFormDefinition.ts';
import { SecondaryInstancesDefinition } from '../parse/model/SecondaryInstance/SecondaryInstancesDefinition.ts';
import { FormFailureResult } from './FormResult/FormFailureResult.ts';
import { FormSuccessResult } from './FormResult/FormSuccessResult.ts';
import { createPotentiallyClientOwnedReactiveScope } from './createPotentiallyClientOwnedReactiveScope.ts';

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
