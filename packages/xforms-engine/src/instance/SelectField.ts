import { xmlXPathWhitespaceSeparatedList } from '@getodk/common/lib/string/whitespace.ts';
import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createMemo, untrack } from 'solid-js';
import type { SelectItem, SelectNode, SelectNodeAppearances } from '../client/SelectNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { SubmissionState } from '../client/submission/SubmissionState.ts';
import type { AnyViolation, LeafNodeValidationState } from '../client/validation.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import { createLeafNodeSubmissionState } from '../lib/client-reactivity/submission/createLeafNodeSubmissionState.ts';
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
import type {
	AnySelectDefinition,
	SelectType,
} from '../parse/body/control/select/SelectDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ValueContext } from './internal-api/ValueContext.ts';
import type { ClientReactiveSubmittableLeafNode } from './internal-api/submission/ClientReactiveSubmittableLeafNode.ts';

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
	extends DescendantNode<SelectFieldDefinition, SelectFieldStateSpec, GeneralParentNode, null>
	implements
		SelectNode,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ValueContext<readonly SelectItem[]>,
		ClientReactiveSubmittableLeafNode<readonly SelectItem[]>
{
	private readonly validation: SharedValidationState;

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<SelectFieldStateSpec>;
	protected override engineState: EngineState<SelectFieldStateSpec>;

	// SelectNode
	readonly nodeType = 'select';
	readonly selectType: SelectType;
	readonly appearances: SelectNodeAppearances;
	readonly currentState: CurrentState<SelectFieldStateSpec>;

	get validationState(): LeafNodeValidationState {
		return this.validation.currentState;
	}

	readonly submissionState: SubmissionState;

	// ValueContext
	override readonly contextNode = this;

	readonly encodeValue = (runtimeValue: readonly SelectItem[]): string => {
		const itemValues = new Set(runtimeValue.map(({ value }) => value));
		const selectedItems = this.getValueOptions().filter(({ value }) => {
			return itemValues.has(value);
		});

		return selectedItems.map(({ value }) => value).join(' ');
	};

	readonly decodeValue = (instanceValue: string): readonly SelectItem[] => {
		const itemValues = new Set(
			xmlXPathWhitespaceSeparatedList(instanceValue, {
				ignoreEmpty: true,
			})
		);

		// TODO: also want set-like behavior, probably?
		return this.getValueOptions().filter((option) => {
			return itemValues.has(option.value);
		});
	};

	protected readonly getValueOptions: Accessor<readonly SelectItem[]>;
	protected readonly getValue: Accessor<readonly SelectItem[]>;

	constructor(parent: GeneralParentNode, definition: SelectFieldDefinition) {
		super(parent, definition);

		this.appearances = definition.bodyElement.appearances;
		this.selectType = definition.bodyElement.type;

		const valueOptions = createSelectItems(this);

		this.getValueOptions = valueOptions;

		const [baseGetValue, setValue] = createValueState(this);

		const getValue = this.scope.runTask(() => {
			const selectItemsByValue = createMemo((): ReadonlyMap<string, SelectItem> => {
				return new Map(valueOptions().map((item) => [item.value, item]));
			});

			return createMemo(() => {
				const items = selectItemsByValue();

				return baseGetValue().filter((item) => {
					return items.has(item.value);
				});
			});
		});

		this.getValue = getValue;

		const valueState: SimpleAtomicState<readonly SelectItem[]> = [getValue, setValue];

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
				value: valueState,
				valueOptions,
			},
			sharedStateOptions
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
		this.validation = createValidationState(this, sharedStateOptions);
		this.submissionState = createLeafNodeSubmissionState(this);
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

	// XFormsXPathElement
	override getXPathValue(): string {
		return this.encodeValue(this.engineState.value);
	}

	// SelectNode
	selectValue(value: string | null): Root {
		let values: readonly [] | readonly [value: string];

		if (value == null) {
			values = [];
		} else {
			values = [value];
		}

		this.updateSelectedItemValues(values);

		return this.root;
	}

	selectValues(values: Iterable<string>): Root {
		this.updateSelectedItemValues(Array.from(values));

		return this.root;
	}

	// InstanceNode
	getChildren(): readonly [] {
		return [];
	}

	// ValidationContext
	getViolation(): AnyViolation | null {
		return this.validation.engineState.violation;
	}

	isBlank(): boolean {
		return this.engineState.value.length === 0;
	}
}
