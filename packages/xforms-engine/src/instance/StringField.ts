import type { InputDefinition } from '../body/control/InputDefinition.ts';
import type { StringNode, StringNodeState } from '../client/StringNode.ts';
import type { ValueNodeDefinition } from '../model/ValueNodeDefinition.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

export interface StringFieldDefinition extends ValueNodeDefinition {
	readonly bodyElement: InputDefinition | null;
}

interface StringFieldState extends StringNodeState, DescendantNodeState {
	get children(): null;
	get valueOptions(): null;
	get value(): string;
}

export abstract class StringField
	extends DescendantNode<StringFieldDefinition, StringFieldState>
	implements StringNode, EvaluationContext, SubscribableDependency
{
	constructor(parent: GeneralParentNode, definition: StringFieldDefinition) {
		super(parent, definition);
	}

	// StringNode
	abstract setValue(value: string): Root;
}
