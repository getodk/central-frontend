import type { BodyClassList } from '../body/BodyDefinition.ts';
import type { RootDefinition } from '../model/RootDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { ActiveLanguage, FormLanguage, FormLanguages } from './FormLanguage.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type { AncestorNodeValidationState } from './validation.ts';

export interface RootNodeState extends BaseNodeState {
	/**
	 * This, along with {@link RootNode.languages} is the most significant break
	   in consistency across node types' state and static properties. Exposing it
	   across all node types seems like a point of potential confusion, so this
	   particular divergence seems like the most reasonable compromise.
	 */
	get activeLanguage(): ActiveLanguage;

	get label(): null;
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

export interface RootNode extends BaseNode {
	readonly nodeType: 'root';

	/**
	 * @todo this along with {@link classes} is... awkward.
	 */
	readonly appearances: null;

	/**
	 * @todo This is another odd deviation in {@link RootNode}. Unlike
	 * {@link languages}, it doesn't feel particularly **essential**. While it
	 * would deviate from XForms spec terminology, it seems like it _might be
	 * reasonable_ to instead convey `<h:body class="...">` as
	 * {@link RootNode.appearances} in the client interface. They do have slightly
	 * different spec semantics (i.e. a body class can be anything, to trigger
	 * styling in a form UI). But the **most likely anticipated** use case in Web
	 * Forms would be the "pages" class, and perhaps "theme-grid". The former is
	 * definitely conceptually similar to a XForms `appearance` (albeit
	 * form-global, which is not a spec concept). The latter does as well, and we
	 * already anticipate applying that concept in non-form-global ways.
	 */
	readonly classes: BodyClassList;

	readonly definition: RootDefinition;
	readonly root: RootNode;
	readonly parent: null;
	readonly currentState: RootNodeState;
	readonly validationState: AncestorNodeValidationState;

	/**
	 * @todo as with {@link RootNodeState.activeLanguage}, this is the most
	 * significant break in consistency across node types.
	 */
	readonly languages: FormLanguages;

	setLanguage(language: FormLanguage): RootNode;
}
