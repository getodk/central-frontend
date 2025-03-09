import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { RankDefinition, RankItem, RankNode, RankValueOptions } from '../client/RankNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { ValueType } from '../client/ValueType.ts';
import { RankMissingValueError } from '../error/RankMissingValueError.ts';
import { RankValueTypeError } from '../error/RankValueTypeError.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticLeafElement } from '../integration/xpath/static-dom/StaticElement.ts';
import { sharedValueCodecs } from '../lib/codecs/getSharedValueCodec.ts';
import { MultipleValueItemCodec } from '../lib/codecs/items/MultipleValueItemCodec.ts';
import { createItemCollection } from '../lib/reactivity/createItemCollection.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { UnknownAppearanceDefinition } from '../parse/body/appearance/unknownAppearanceParser.ts';
import type { Root } from './Root.ts';
import type { ValueNodeStateSpec } from './abstract/ValueNode.ts';
import { ValueNode } from './abstract/ValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ClientReactiveSerializableValueNode } from './internal-api/serialization/ClientReactiveSerializableValueNode.ts';

export type AnyRankDefinition = {
	[V in ValueType]: RankDefinition<V>;
}[ValueType];

type AssertRankNodeDefinition = (
	definition: AnyRankDefinition
) => asserts definition is RankDefinition<'string'>;

const assertRankNodeDefinition: AssertRankNodeDefinition = (definition) => {
	if (definition.valueType !== 'string') {
		throw new RankValueTypeError(definition);
	}
};

type RankItemMap = ReadonlyMap<string, RankItem>;

interface RankControlStateSpec extends ValueNodeStateSpec<readonly string[]> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly valueOptions: Accessor<RankValueOptions>;
}

/**
 * @ToDo We currently represent a blank value for `<odk:rank>` as an empty array.
 * This is ambiguous, and likely to change.
 *
 * @see {@link https://github.com/getodk/web-forms/issues/295}
 */
type TempBlankValueState = readonly [];
const isBlankValueState = (values: readonly string[]): values is TempBlankValueState => {
	return values.length === 0;
};

export class RankControl
	extends ValueNode<'string', RankDefinition<'string'>, readonly string[], readonly string[]>
	implements
		RankNode,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ClientReactiveSerializableValueNode
{
	static from(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: RankDefinition
	): RankControl;
	static from(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: AnyRankDefinition
	): RankControl {
		assertRankNodeDefinition(definition);
		return new this(parent, instanceNode, definition);
	}

	private readonly mapOptionsByValue: Accessor<RankItemMap>;

	protected override readonly getInstanceValue: Accessor<string>;

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<RankControlStateSpec>;
	protected readonly engineState: EngineState<RankControlStateSpec>;

	// RankNode
	readonly nodeType = 'rank';
	readonly appearances: UnknownAppearanceDefinition;
	readonly nodeOptions = null;
	readonly currentState: CurrentState<RankControlStateSpec>;

	private constructor(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: RankDefinition<'string'>
	) {
		const codec = new MultipleValueItemCodec(sharedValueCodecs.string);
		super(parent, instanceNode, definition, codec);

		this.appearances = definition.bodyElement.appearances;

		const valueOptions = createItemCollection(this);
		const mapOptionsByValue: Accessor<RankItemMap> = this.scope.runTask(() => {
			return createMemo(() => {
				return new Map(valueOptions().map((item) => [item.value, item]));
			});
		});

		this.mapOptionsByValue = mapOptionsByValue;

		const baseValueState = this.valueState;
		const [baseGetValue, setValue] = baseValueState;

		/**
		 * @ToDo As new value options become available, they're not yet in the
		 * `currentValues` state. This appends them. We intend to change this
		 * behavior, likely clearing the previous state instead.
		 *
		 * However, there's an open question about what we should do when a filter
		 * change **only removes values**.
		 */
		const getValue = this.scope.runTask(() => {
			return createMemo(() => {
				const options = valueOptions();
				const values = baseGetValue();

				if (isBlankValueState(values)) {
					return values;
				}

				const optionValues = new Set(options.map((option) => option.value));

				/**
				 * @see {@link getValue} ToDo paragraph 2.
				 */
				const currentValues = values.filter((value) => optionValues.has(value));

				return Array.from(
					new Set([
						...currentValues,
						/**
						 * @see {@link getValue} ToDo paragraph 1.
						 */
						...optionValues,
					])
				);
			});
		});
		const valueState: SimpleAtomicState<readonly string[]> = [getValue, setValue];

		this.getInstanceValue = this.scope.runTask(() => {
			return createMemo(() => codec.encodeValue(getValue()));
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

	getValueLabel(value: string): TextRange<'item-label'> | null {
		const valueOption = this.currentState.valueOptions.find((item) => item.value === value);
		return valueOption?.label ?? null;
	}

	setValues(valuesInOrder: readonly string[]): Root {
		if (isBlankValueState(valuesInOrder)) {
			this.setValueState(valuesInOrder);
			return this.root;
		}

		const sourceValues: string[] = Array.from(this.mapOptionsByValue().keys());
		const hasAllValues = sourceValues.every((sourceValue) => valuesInOrder.includes(sourceValue));
		if (!hasAllValues) {
			throw new RankMissingValueError('There are missing options. Rank should have all options.');
		}

		this.setValueState(valuesInOrder);
		return this.root;
	}
}
