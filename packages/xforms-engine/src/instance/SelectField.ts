import { xmlXPathWhitespaceSeparatedList } from '@odk-web-forms/common/lib/string/whitespace.ts';
import type { Accessor } from 'solid-js';
import type { AnySelectDefinition } from '../body/control/select/SelectDefinition.ts';
import type { SelectItem, SelectNode } from '../client/SelectNode.ts';
import type { TextRange } from '../index.ts';
import { createSelectItems } from '../lib/reactivity/createSelectItems.ts';
import { createValueState } from '../lib/reactivity/createValueState.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { ValueNodeDefinition } from '../model/ValueNodeDefinition.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';
import type { ValueContext } from './internal-api/ValueContext.ts';

export interface SelectFieldDefinition extends ValueNodeDefinition {
	readonly bodyElement: AnySelectDefinition;
}

interface SelectFieldStateSpec extends DescendantNodeStateSpec<readonly SelectItem[]> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly children: null;
	readonly value: SimpleAtomicState<readonly SelectItem[]>;
	readonly valueOptions: Accessor<readonly SelectItem[]>;
}

export class SelectField
	extends DescendantNode<SelectFieldDefinition, SelectFieldStateSpec>
	implements
		SelectNode,
		EvaluationContext,
		SubscribableDependency,
		ValueContext<readonly SelectItem[]>
{
	protected readonly state: SharedNodeState<SelectFieldStateSpec>;
	protected override engineState: EngineState<SelectFieldStateSpec>;

	readonly currentState: CurrentState<SelectFieldStateSpec>;

	// ValueContext
	readonly encodeValue = (runtimeValue: readonly SelectItem[]): string => {
		const itemValues = new Set(runtimeValue.map(({ value }) => value));

		return Array.from(itemValues).join(' ');
	};

	readonly decodeValue = (instanceValue: string): readonly SelectItem[] => {
		return this.scope.runTask(() => {
			const values = xmlXPathWhitespaceSeparatedList(instanceValue, {
				ignoreEmpty: true,
			});

			const items = this.getSelectItemsByValue(this.getValueOptions());

			return values
				.map((value) => {
					return items.get(value);
				})
				.filter((item): item is SelectItem => {
					return item != null;
				});
		});
	};

	protected readonly getValueOptions: Accessor<readonly SelectItem[]>;

	constructor(parent: GeneralParentNode, definition: SelectFieldDefinition) {
		super(parent, definition);

		const valueOptions = createSelectItems(this);

		this.getValueOptions = valueOptions;

		const state = createSharedNodeState(
			this.scope,
			{
				...this.buildSharedStateSpec(parent, definition),

				label: createNodeLabel(this, definition),
				hint: createFieldHint(this, definition),
				children: null,
				value: createValueState(this),
				valueOptions,
			},
			{
				clientStateFactory: this.engineConfig.stateFactory,
			}
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
	}

	protected getSelectItemsByValue(
		valueOptions: readonly SelectItem[]
	): ReadonlyMap<string, SelectItem> {
		return new Map(
			valueOptions.map((item) => {
				return [item.value, item];
			})
		);
	}

	protected computeReference(parent: GeneralParentNode): string {
		return this.computeChildStepReference(parent);
	}

	// SelectNode
	select(_item: SelectItem): Root {
		throw new Error('Not implemented');
	}

	deselect(_item: SelectItem): Root {
		throw new Error('Not implemented');
	}
}
