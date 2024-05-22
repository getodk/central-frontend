import type { Context } from '../../context/Context.ts';
import { FN_NAMESPACE_URI } from '../NamespaceResolver.ts';
import type { FunctionImplementation } from './FunctionImplementation.ts';
import type { FunctionLibrary } from './FunctionLibrary.ts';

class UnknownFunctionLibraryError extends Error {
	constructor(namespaceURI: string) {
		super(`Unknown function library for namespace ${namespaceURI}`);
	}
}

interface BaseFunctionNameLookup {
	readonly namespaceURI?: string | null;
	readonly prefix?: string | null;
	readonly localName: string;
}

interface NamespacedFunctionNameLookup extends BaseFunctionNameLookup {
	readonly namespaceURI: string | null;
}

interface PrefixedFunctionNameLookup extends BaseFunctionNameLookup {
	readonly prefix: string | null;
}

type FunctionNameLookup = NamespacedFunctionNameLookup | PrefixedFunctionNameLookup;

interface FunctionLibraryCollectionOptions {
	/**
	 * @default ['http://www.w3.org/2005/xpath-functions']
	 */
	readonly defaultNamespaceURIs?: readonly string[];
}

// TODO:
//
// 1. Is there any reason not to *always* provide `fn`-namespaced functions (and
//    is there any reason not to *always* make them available unprefixed)?
//
// 2. XFormsXPathEvaluator is now effectively a reference implementation
//    demonstrating custom functions. This has different semantics than ORXE
//    (where overrides are explicitly disallowed), otherwise I'd be inclined to
//    both document its usage now and to update the custom function tests to use
//    the @getodk/xpath API (which would of course be a breaking change if we do
//    decide to backport this implementation to Enketo...).
export class FunctionLibraryCollection {
	/**
	 * Default function libraries determine, for a given Evaluator instance and
	 * its corresponding FunctionLibraryCollection instance, which function calls
	 * may be resolved without a prefix.
	 *
	 * Unprefixed functions are looked up by local name in each successive default
	 * library until one is matched. For example, when both the `xf` and `fn`
	 * libraries are defaults (in that order), `number` will resolve to the `xf`
	 * namespace because it provides a function with `localName: number`
	 * (overriding the default `fn:number`), whereas `string` will resolve to the
	 * `fn` namespace, because the `xf` namespace does not override it.
	 */
	protected readonly defaultFunctionLibraries: readonly FunctionLibrary[];

	protected readonly namespacedFunctionLibraries: ReadonlyMap<string, FunctionLibrary>;

	constructor(
		functionLibraries: Iterable<FunctionLibrary>,
		options: FunctionLibraryCollectionOptions = {}
	) {
		const namespacedFunctionLibraries = new Map<string, FunctionLibrary>();

		for (const functionLibrary of functionLibraries) {
			const { namespaceURI } = functionLibrary;

			if (namespacedFunctionLibraries.has(namespaceURI)) {
				throw new Error(`Multiple function libraries for namespace: ${namespaceURI}`);
			}

			namespacedFunctionLibraries.set(namespaceURI, functionLibrary);
		}

		this.namespacedFunctionLibraries = namespacedFunctionLibraries;

		const { defaultNamespaceURIs = [FN_NAMESPACE_URI] } = options;

		this.defaultFunctionLibraries = defaultNamespaceURIs.map((namespaceURI) => {
			const functionLibrary = namespacedFunctionLibraries.get(namespaceURI);

			if (functionLibrary == null) {
				throw new Error(`No function library for default namespace: ${namespaceURI}`);
			}

			return functionLibrary;
		});
	}

	getDefaultImplementation(localName: string): FunctionImplementation<number> | null {
		for (const functionLibrary of this.defaultFunctionLibraries) {
			const functionImplementation = functionLibrary.getImplementation(localName);

			if (functionImplementation != null) {
				return functionImplementation;
			}
		}

		return null;
	}

	getImplementation(
		context: Context,
		name: FunctionNameLookup
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): FunctionImplementation<any> | null {
		const { localName, namespaceURI, prefix } = name;

		const resolvedNamespaceURI =
			namespaceURI ?? context.namespaceResolver.lookupNamespaceURI(prefix ?? FN_NAMESPACE_URI);

		if (resolvedNamespaceURI == null) {
			return this.getDefaultImplementation(localName);
		}

		const functionLibrary = this.namespacedFunctionLibraries.get(resolvedNamespaceURI);

		if (functionLibrary == null) {
			throw new UnknownFunctionLibraryError(resolvedNamespaceURI);
		}

		return functionLibrary.getImplementation(localName);
	}
}
