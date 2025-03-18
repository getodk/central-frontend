import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type {
	SelectDefinition,
	SelectItem,
	SelectNode,
	SelectNodeAppearances,
	SelectValueOptions,
} from '../client/SelectNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { ValueType } from '../client/ValueType.ts';
import { SelectValueTypeError } from '../error/SelectValueTypeError.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticLeafElement } from '../integration/xpath/static-dom/StaticElement.ts';
import { getSelectCodec } from '../lib/codecs/getSelectCodec.ts';
import { createItemCollection } from '../lib/reactivity/createItemCollection.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { SelectType } from '../parse/body/control/SelectControlDefinition.ts';
import type { Root } from './Root.ts';
import type { ValueNodeStateSpec } from './abstract/ValueNode.ts';
import { ValueNode } from './abstract/ValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ClientReactiveSerializableValueNode } from './internal-api/serialization/ClientReactiveSerializableValueNode.ts';

export type AnySelectDefinition = {
	[V in ValueType]: SelectDefinition<V>;
}[ValueType];

type AssertSupportedSelectValueType = (
	definition: AnySelectDefinition
) => asserts definition is SelectDefinition<'string'>;

const assertSupportedSelectValueType: AssertSupportedSelectValueType = (definition) => {
	if (definition.valueType !== 'string') {
		throw new SelectValueTypeError(definition);
	}
};

type SelectItemMap = ReadonlyMap<string, SelectItem>;

interface SelectControlStateSpec extends ValueNodeStateSpec<readonly string[]> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly valueOptions: Accessor<SelectValueOptions>;
}

export class SelectControl
	extends ValueNode<'string', SelectDefinition<'string'>, readonly string[], readonly string[]>
	implements
		SelectNode,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ClientReactiveSerializableValueNode
{
	static from(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: SelectDefinition
	): SelectControl;
	static from(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: AnySelectDefinition
	): SelectControl {
		assertSupportedSelectValueType(definition);

		return new this(parent, instanceNode, definition);
	}

	private readonly mapOptionsByValue: Accessor<SelectItemMap>;

	protected override readonly getInstanceValue: Accessor<string>;

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<SelectControlStateSpec>;
	protected readonly engineState: EngineState<SelectControlStateSpec>;

	// SelectNode
	readonly nodeType = 'select';
	readonly selectType: SelectType;
	readonly appearances: SelectNodeAppearances;
	readonly nodeOptions = null;
	readonly currentState: CurrentState<SelectControlStateSpec>;

	private constructor(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: SelectDefinition<'string'>
	) {
		const codec = getSelectCodec(definition);

		super(parent, instanceNode, definition, codec);

		this.appearances = definition.bodyElement.appearances;
		this.selectType = definition.bodyElement.type;

		const valueOptions = createItemCollection(this);

		const mapOptionsByValue: Accessor<SelectItemMap> = this.scope.runTask(() => {
			return createMemo(() => {
				return new Map(valueOptions().map((item) => [item.value, item]));
			});
		});

		this.mapOptionsByValue = mapOptionsByValue;

		const baseValueState = this.valueState;
		const [baseGetValue, setValue] = baseValueState;
		const getValue = this.scope.runTask(() => {
			return createMemo(() => {
				const optionsByValue = mapOptionsByValue();

				return baseGetValue().filter((value) => {
					return optionsByValue.has(value);
				});
			});
		});
		const valueState: SimpleAtomicState<readonly string[]> = [getValue, setValue];

		this.getInstanceValue = this.scope.runTask(() => {
			return createMemo(() => {
				return codec.encodeValue(getValue());
			});
		});

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
				valueOptions,
				value: valueState,
				instanceValue: this.getInstanceValue,
			},
			this.instanceConfig
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
	}

	/**
	 * Filters {@link values} to include only those values which are currently
	 * available in the mapping produced by {@link mapOptionsByValue}, i.e. within
	 * a potentially filtered itemset.
	 *
	 * Note: this method effectively produces an intersection of
	 * {@link sourceValues} and {@link values}. **Importantly**, ordering of the
	 * results is deterministic, preserving the order of values as yielded _by
	 * {@link sourceValues}_.
	 *
	 * At time of writing, there are several tests (in `@getodk/scenario`, ported
	 * from JavaRosa) which expect the values of a `<select>` to match the order
	 * they appear in the control's (potentially filtered) `<itemset>` (or list of
	 * `<item>`s, for forms defining those inline).
	 *
	 * @todo The `<odk:rank>` control, having semantics very similar to
	 * `<select>`, will likely perform similar filtering logic. However, one of
	 * the important distinctions between these controls is that `<odk:rank>`
	 * exists explicitly to control the order of values. It's quite likely that
	 * would be achieved by invoking the same logic with the parameter order
	 * reversed.
	 */
	private filterValues(
		sourceValues: Iterable<string>,
		values: Iterable<string>
	): readonly string[] {
		const selectedValues = new Set(values);

		return Array.from(sourceValues).filter((sourceValue) => {
			return selectedValues.has(sourceValue);
		});
	}

	// SelectNode
	getValueOption(value: string): SelectItem | null {
		// Note: this method is a client-facing convenience API for reading state,
		// so it **MUST** read from client-reactive state!
		const valueOption = this.currentState.valueOptions.find((item) => {
			return item.value === value;
		});

		return valueOption ?? null;
	}

	isSelected(value: string): boolean {
		// Note: this method is a client-facing convenience API for reading state,
		// so it **MUST** read from client-reactive state!
		return this.currentState.value.includes(value);
	}

	selectValue(value: string | null): Root {
		if (value == null) {
			return this.selectValues([]);
		}

		return this.selectValues([value]);
	}

	selectValues(values: readonly string[]): Root {
		const sourceValues = this.mapOptionsByValue().keys();
		const effectiveValues = this.filterValues(sourceValues, values);

		this.setValueState(effectiveValues);

		return this.root;
	}
}
