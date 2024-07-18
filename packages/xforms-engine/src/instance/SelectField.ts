import { xmlXPathWhitespaceSeparatedList } from '@getodk/common/lib/string/whitespace.ts';
import type { Accessor } from 'solid-js';
import { untrack } from 'solid-js';
import type { AnySelectDefinition } from '../body/control/select/SelectDefinition.ts';
import type { SelectItem, SelectNode, SelectNodeAppearances } from '../client/SelectNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { AnyViolation, LeafNodeValidationState } from '../client/validation.ts';
import { createSelectItems } from '../lib/reactivity/createSelectItems.ts';
import { createValueState } from '../lib/reactivity/createValueState.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { SharedValidationState } from '../lib/reactivity/validation/createValidation.ts';
import { createValidationState } from '../lib/reactivity/validation/createValidation.ts';
import type { LeafNodeDefinition } from '../model/LeafNodeDefinition.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ValueContext } from './internal-api/ValueContext.ts';

export interface SelectFieldDefinition extends LeafNodeDefinition {
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
	extends DescendantNode<SelectFieldDefinition, SelectFieldStateSpec, null>
	implements
		SelectNode,
		EvaluationContext,
		SubscribableDependency,
		ValidationContext,
		ValueContext<readonly SelectItem[]>
{
	private readonly selectExclusive: boolean;
	private readonly validation: SharedValidationState;

	// InstanceNode
	protected readonly state: SharedNodeState<SelectFieldStateSpec>;
	protected override engineState: EngineState<SelectFieldStateSpec>;

	// SelectNode
	readonly nodeType = 'select';
	readonly appearances: SelectNodeAppearances;
	readonly currentState: CurrentState<SelectFieldStateSpec>;

	get validationState(): LeafNodeValidationState {
		return this.validation.currentState;
	}

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

			const items = this.getSelectItemsByValue();

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

		this.appearances = definition.bodyElement.appearances;
		this.selectExclusive = definition.bodyElement.type === 'select1';

		const valueOptions = createSelectItems(this);

		this.getValueOptions = valueOptions;

		const sharedStateOptions = {
			clientStateFactory: this.engineConfig.stateFactory,
		};

		const state = createSharedNodeState(
			this.scope,
			{
				reference: this.contextReference,
				readonly: this.isReadonly,
				relevant: this.isRelevant,
				required: this.isRequired,

				label: createNodeLabel(this, definition),
				hint: createFieldHint(this, definition),
				children: null,
				value: createValueState(this),
				valueOptions,
			},
			sharedStateOptions
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
		this.validation = createValidationState(this, sharedStateOptions);
	}

	getViolation(): AnyViolation | null {
		return this.validation.engineState.violation;
	}

	protected getSelectItemsByValue(
		valueOptions: readonly SelectItem[] = this.getValueOptions()
	): ReadonlyMap<string, SelectItem> {
		return new Map(
			valueOptions.map((item) => {
				return [item.value, item];
			})
		);
	}

	protected updateSelectedItemValues(values: readonly string[]) {
		const itemsByValue = untrack(() => this.getSelectItemsByValue());

		const items = values.flatMap((value) => {
			const item = itemsByValue.get(value);

			if (item == null) {
				return [];
			}

			return item ?? [];
		});

		this.state.setProperty('value', items);
	}

	protected setSelectedItemValue(value: string | null) {
		if (value == null) {
			this.state.setProperty('value', []);

			return;
		}

		this.updateSelectedItemValues([value]);
	}

	// SelectNode
	select(selectedItem: SelectItem): Root {
		const { engineState, root } = this;

		if (this.selectExclusive) {
			this.setSelectedItemValue(selectedItem.value);

			return root;
		}

		const currentValues = engineState.value.map(({ value }) => {
			return value;
		});

		const selectedValue = selectedItem.value;

		if (currentValues.includes(selectedValue)) {
			return root;
		}

		this.updateSelectedItemValues(currentValues.concat(selectedValue));

		return root;
	}

	deselect(deselectedItem: SelectItem): Root {
		const { engineState, root } = this;

		const currentValues = engineState.value.map(({ value }) => {
			return value;
		});

		const selectedValue = deselectedItem.value;

		if (!currentValues.includes(selectedValue)) {
			return root;
		}

		const updatedValues = currentValues.filter((value) => {
			return value !== selectedValue;
		});

		this.updateSelectedItemValues(updatedValues);

		return root;
	}

	// InstanceNode
	getChildren(): readonly [] {
		return [];
	}

	// ValidationContext
	isBlank(): boolean {
		return this.engineState.value.length === 0;
	}
}
