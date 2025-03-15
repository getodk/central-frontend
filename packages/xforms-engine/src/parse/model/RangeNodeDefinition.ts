import type { ValueType } from '../../client/ValueType.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { StaticLeafElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { RuntimeValue, SharedValueCodec } from '../../lib/codecs/getSharedValueCodec.ts';
import { getSharedValueCodec } from '../../lib/codecs/getSharedValueCodec.ts';
import type {
	RangeControlBoundsDefinition,
	RangeControlDefinition,
} from '../body/control/RangeControlDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { LeafNodeDefinition } from './LeafNodeDefinition.ts';
import type { ParentNodeDefinition } from './NodeDefinition.ts';

const RANGE_VALUE_TYPES = ['decimal', 'int'] as const;

export type RangeValueType = (typeof RANGE_VALUE_TYPES)[number];

type AssertedRangeValueType<V extends ValueType> = Extract<V, RangeValueType>;

type AssertRangeBindDefinition = <V extends ValueType>(
	bind: BindDefinition<V>
) => asserts bind is BindDefinition<AssertedRangeValueType<V>>;

const assertRangeBindDefinition: AssertRangeBindDefinition = (bind) => {
	if (!RANGE_VALUE_TYPES.includes(bind.type.resolved as RangeValueType)) {
		throw new ErrorProductionDesignPendingError(
			`Expected range to have bind type "decimal" or "int", got: ${bind.type.resolved}`
		);
	}
};

export interface RangeLeafNodeDefinition<V extends ValueType = ValueType>
	extends LeafNodeDefinition<V> {
	readonly bodyElement: RangeControlDefinition;
}

const decodeBoundsValue = <V extends ValueType>(
	codec: SharedValueCodec<V>,
	value: string
): NonNullable<RuntimeValue<V>> => {
	const decoded = codec.decodeValue(value);

	if (decoded == null) {
		throw new ErrorProductionDesignPendingError(
			`Failed to decode bounds value (encoded as ${JSON.stringify(value)})`
		);
	}

	return decoded;
};

class RangeNodeBoundsDefinition<V extends RangeValueType = RangeValueType> {
	static from<V extends RangeValueType>(
		bounds: RangeControlBoundsDefinition,
		bind: BindDefinition<V>
	): RangeNodeBoundsDefinition<V> {
		const type = bind.type.resolved;
		const codec = getSharedValueCodec(type);
		const min = decodeBoundsValue(codec, bounds.start);
		const max = decodeBoundsValue(codec, bounds.end);
		const step = decodeBoundsValue(codec, bounds.step);

		return new this(min, max, step);
	}

	constructor(
		readonly min: NonNullable<RuntimeValue<V>>,
		readonly max: NonNullable<RuntimeValue<V>>,
		readonly step: NonNullable<RuntimeValue<V>>
	) {}
}

/**
 * @todo We should really consider making `LeafNodeDefinition` an abstract base
 * class, and each node's definition an explicit concrete subclass of that. It
 * would simplify a lot of things, reduce redundancy (and drift!) between
 * various like `*Definition` types, and allow us to reason more clearly about
 * what parse-product-input is used to construct each primary instance node.
 * Furthermore, it would give us a great deal more flexibility to revisit some
 * of the weaker parts of our current data model (e.g. splitting up selects).
 *
 * I explored this refactor as part of the prerequisite work to support range
 * controls. I eventually backed out because it involved more churn than I felt
 * comfortable with, but I do think we should keep an eye out for other
 * opportunities to take on the churn.
 */
export class RangeNodeDefinition<V extends RangeValueType = RangeValueType>
	extends LeafNodeDefinition<V>
	implements RangeLeafNodeDefinition<V>
{
	static from<V extends ValueType>(
		parent: ParentNodeDefinition,
		bind: BindDefinition<V>,
		bodyElement: RangeControlDefinition,
		node: StaticLeafElement
	): RangeNodeDefinition<Extract<V, RangeValueType>> {
		assertRangeBindDefinition(bind);

		return new this(parent, bind, bodyElement, node);
	}

	readonly bounds: RangeNodeBoundsDefinition<V>;

	private constructor(
		parent: ParentNodeDefinition,
		override readonly bind: BindDefinition<V>,
		override readonly bodyElement: RangeControlDefinition,
		node: StaticLeafElement
	) {
		super(parent, bind, bodyElement, node);

		this.bounds = RangeNodeBoundsDefinition.from(bodyElement.bounds, bind);
	}
}

// prettier-ignore
export type AnyRangeNodeDefinition =
	| RangeNodeDefinition<'decimal'>
	| RangeNodeDefinition<'int'>;
