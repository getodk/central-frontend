import type { AnySelectDefinition } from '../body/control/select/SelectDefinition.ts';
import type { SelectItem, SelectNode, SelectNodeState } from '../client/SelectNode.ts';
import type { ValueNodeDefinition } from '../model/ValueNodeDefinition.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

export interface SelectFieldDefinition extends ValueNodeDefinition {
	readonly bodyElement: AnySelectDefinition;
}

interface SelectFieldState extends SelectNodeState, DescendantNodeState {
	get children(): null;
	get valueOptions(): readonly SelectItem[];
	get value(): readonly SelectItem[];
}

export abstract class SelectField
	extends DescendantNode<SelectFieldDefinition, SelectFieldState>
	implements SelectNode, EvaluationContext, SubscribableDependency
{
	constructor(parent: GeneralParentNode, definition: SelectFieldDefinition) {
		super(parent, definition);
	}

	// SelectNode
	abstract select(item: SelectItem): Root;
	abstract deselect(item: SelectItem): Root;
}
