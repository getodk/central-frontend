import type { FormLanguage } from '../../client/FormLanguage.ts';
import type { RootNode, RootNodeState } from '../../client/RootNode.ts';

export interface PrimaryInstanceDocumentState
	extends Omit<
		RootNodeState,
		// Allow for override with `RootNode`, which is not presently considered a
		// child node in the client API
		'children'
	> {
	/**
	 * @todo while this is an internal interface, this feels like maybe an
	 * unnecessary indirection? It would probably be fine for it to reference
	 * `Root` directly? We do get some minor benefit from making sure the client
	 * and internal types are aligned, but we also already enforce that by
	 * ensuring `Root implements RootNode`...
	 */
	get children(): readonly RootNode[];
}

/**
 * Provides an interface most similar to what we would expose at the
 * `@getodk/xforms-engine` package boundary, if we were to document the primary
 * instance document's types for a client.
 *
 * Note: this interface (as well as {@link currentState}'s {@link PrimaryInstanceDocumentState}) is derived from {@link RootNode} to help avoid drift if that underlying interface (or its shared {@link BaseNode} interface) is updated.
 *
 */
export interface PrimaryInstanceDocument
	extends Omit<
		RootNode,
		// prettier-ignore
		// eslint-disable-next-line @typescript-eslint/sort-type-constituents
		| 'nodeType' // Allow for override with 'primary-instance'
		| 'currentState' // Allow for override of `children`
		| 'setLanguage' // Allow for override of return type
	> {
	readonly nodeType: 'primary-instance';
	readonly currentState: PrimaryInstanceDocumentState;

	/**
	 * @todo This intentionally returns `unknown` as a hint that we will likely
	 * want to move away from returning {@link RootNode} (i.e. "all of the state",
	 * as it was conceived in that design effort) on every state change.
	 *
	 * In this case, it may be sensible to return any of:
	 *
	 * - Just the state set directly (i.e. the input {@link FormLanguage})
	 * - That effective state, and some representation of all affected nodes
	 * - Something less obvious, but potentially more useful to clients?
	 */
	setLanguage(language: FormLanguage): unknown;
}
