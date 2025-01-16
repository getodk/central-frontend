import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type {
	SelectDefinition,
	SelectItem,
	SelectItemValue,
	SelectNode,
	SelectNodeAppearances,
	SelectValueOptions,
	SelectValues,
} from '../client/SelectNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { ValueType } from '../client/ValueType.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import { getSelectCodec } from '../lib/codecs/select/getSelectCodec.ts';
import { createSelectItems } from '../lib/reactivity/createSelectItems.ts';
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
import type { ClientReactiveSubmittableValueNode } from './internal-api/submission/ClientReactiveSubmittableValueNode.ts';

export type AnySelectDefinition = {
	[V in ValueType]: SelectDefinition<V>;
}[ValueType];

interface SelectControlStateSpec<V extends ValueType> extends ValueNodeStateSpec<SelectValues<V>> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly valueOptions: Accessor<SelectValueOptions<V>>;
}

export class SelectControl<V extends ValueType = ValueType>
	extends ValueNode<V, SelectDefinition<V>, SelectValues<V>, SelectValues<V>>
	implements
		SelectNode<V>,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ClientReactiveSubmittableValueNode
{
	static from(parent: GeneralParentNode, definition: SelectDefinition): AnySelectControl;
	static from<V extends ValueType>(
		parent: GeneralParentNode,
		definition: SelectDefinition<V>
	): SelectControl<V> {
		return new this(parent, definition);
	}

	private readonly mapOptionsByValue: Accessor<ReadonlyMap<SelectItemValue<V>, SelectItem<V>>>;

	protected override readonly getInstanceValue: Accessor<string>;

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<SelectControlStateSpec<V>>;
	protected readonly engineState: EngineState<SelectControlStateSpec<V>>;

	// SelectNode
	readonly nodeType = 'select';
	readonly selectType: SelectType;
	readonly appearances: SelectNodeAppearances;
	readonly currentState: CurrentState<SelectControlStateSpec<V>>;

	constructor(parent: GeneralParentNode, definition: SelectDefinition<V>) {
		const codec = getSelectCodec(definition);

		super(parent, definition, codec);

		this.appearances = definition.bodyElement.appearances;
		this.selectType = definition.bodyElement.type;

		const valueOptions = createSelectItems(this, codec);

		const mapOptionsByValue: Accessor<ReadonlyMap<SelectItemValue<V>, SelectItem<V>>> =
			this.scope.runTask(() => {
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
		const valueState: SimpleAtomicState<SelectValues<V>> = [getValue, setValue];

		this.getInstanceValue = this.scope.runTask(() => {
			return createMemo(() => {
				return codec.encodeValue(getValue());
			});
		});

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
				valueOptions,
				value: valueState,
				instanceValue: this.getInstanceValue,
			},
			sharedStateOptions
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
		sourceValues: Iterable<SelectItemValue<V>>,
		values: Iterable<SelectItemValue<V>>
	): SelectValues<V> {
		const selectedValues = new Set(values);

		return Array.from(sourceValues).filter((sourceValue) => {
			return selectedValues.has(sourceValue);
		});
	}

	// SelectNode
	getValueOption<T extends ValueType>(
		this: SelectControl<T>,
		value: SelectItemValue<T>
	): SelectItem<T> | null {
		// Note: this method is a client-facing convenience API for reading state,
		// so it **MUST** read from client-reactive state!
		const valueOption = this.currentState.valueOptions.find((item) => {
			return item.value === value;
		});

		return valueOption ?? null;
	}

	isSelected<T extends ValueType>(this: SelectControl<T>, value: SelectItemValue<T>): boolean {
		// Note: this method is a client-facing convenience API for reading state,
		// so it **MUST** read from client-reactive state!
		return this.currentState.value.includes(value);
	}

	selectValue<T extends ValueType>(this: SelectControl<T>, value: SelectItemValue<T> | null): Root {
		if (value == null) {
			return this.selectValues([]);
		}

		return this.selectValues([value]);
	}

	selectValues<T extends ValueType>(this: SelectControl<T>, values: SelectValues<T>): Root {
		const sourceValues = this.mapOptionsByValue().keys();
		const effectiveValues = this.filterValues(sourceValues, values);

		this.setValueState(effectiveValues);

		return this.root;
	}
}

export type AnySelectControl =
	| SelectControl<'barcode'>
	| SelectControl<'binary'>
	| SelectControl<'boolean'>
	| SelectControl<'date'>
	| SelectControl<'dateTime'>
	| SelectControl<'decimal'>
	| SelectControl<'geopoint'>
	| SelectControl<'geoshape'>
	| SelectControl<'geotrace'>
	| SelectControl<'int'>
	| SelectControl<'intent'>
	| SelectControl<'string'>
	| SelectControl<'time'>;
