import type { RootDefinition } from '../model/RootDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { ActiveLanguage, FormLanguage, FormLanguages } from './FormLanguage.ts';
import type { GeneralChildNode } from './hierarchy.ts';

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
	readonly definition: RootDefinition;
	readonly root: RootNode;
	readonly parent: null;
	readonly currentState: RootNodeState;

	/**
	 * @todo as with {@link RootNodeState.activeLanguage}, this is the most
	 * significant break in consistency across node types.
	 */
	readonly languages: FormLanguages;

	setLanguage(language: FormLanguage): RootNode;
}
