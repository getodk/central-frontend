import type { XFormDefinition } from '../XFormDefinition.ts';
import type { ActiveLanguage, FormLanguage, FormLanguages } from '../client/FormLanguage.ts';
import type { RootNode, RootNodeState } from '../client/RootNode.ts';
import type { RootDefinition } from '../model/RootDefinition.ts';
import type { InstanceNodeState } from './abstract/InstanceNode.ts';
import { InstanceNode } from './abstract/InstanceNode.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { InstanceConfig } from './internal-api/InstanceConfig.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface RootState extends RootNodeState, InstanceNodeState {
	get label(): null;
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;

	// Root-specific
	get activeLanguage(): ActiveLanguage;
}

export abstract class Root
	extends InstanceNode<RootDefinition, RootState>
	implements RootNode, EvaluationContext, SubscribableDependency
{
	// RootNode
	abstract override readonly parent: null;

	abstract readonly languages: FormLanguages;

	constructor(form: XFormDefinition, engineConfig: InstanceConfig) {
		super(engineConfig, form.model.root);
	}

	// RootNode
	abstract setLanguage(language: FormLanguage): Root;

	// EvaluationContext
	abstract getNodeByReference(reference: string): SubscribableDependency | null;
	abstract getDescendantByReference(reference: string): null;

	// Subscribable
	abstract override subscribe(): void;
}
