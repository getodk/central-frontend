const NODE_SET_RESULT_TYPE = -1;

export type NodeSetResultType = typeof NODE_SET_RESULT_TYPE;

export type PrimitiveResultType =
	| BaseResult['BOOLEAN_TYPE']
	| BaseResult['NUMBER_TYPE']
	| BaseResult['STRING_TYPE'];

type BaseResultType = NodeSetResultType | PrimitiveResultType;

const {
	ANY_TYPE,
	NUMBER_TYPE,
	STRING_TYPE,
	BOOLEAN_TYPE,
	UNORDERED_NODE_ITERATOR_TYPE,
	ORDERED_NODE_ITERATOR_TYPE,
	UNORDERED_NODE_SNAPSHOT_TYPE,
	ORDERED_NODE_SNAPSHOT_TYPE,
	ANY_UNORDERED_NODE_TYPE,
	FIRST_ORDERED_NODE_TYPE,
} = XPathResult;

export abstract class BaseResult {
	protected abstract readonly type: BaseResultType;
	protected abstract readonly nodes: Iterable<Node> | null;

	abstract readonly isIntermediateResult: boolean;

	static readonly ANY_TYPE = ANY_TYPE;
	static readonly NUMBER_TYPE = NUMBER_TYPE;
	static readonly STRING_TYPE = STRING_TYPE;
	static readonly BOOLEAN_TYPE = BOOLEAN_TYPE;
	static readonly UNORDERED_NODE_ITERATOR_TYPE = UNORDERED_NODE_ITERATOR_TYPE;
	static readonly ORDERED_NODE_ITERATOR_TYPE = ORDERED_NODE_ITERATOR_TYPE;
	static readonly UNORDERED_NODE_SNAPSHOT_TYPE = UNORDERED_NODE_SNAPSHOT_TYPE;
	static readonly ORDERED_NODE_SNAPSHOT_TYPE = ORDERED_NODE_SNAPSHOT_TYPE;
	static readonly ANY_UNORDERED_NODE_TYPE = ANY_UNORDERED_NODE_TYPE;
	static readonly FIRST_ORDERED_NODE_TYPE = FIRST_ORDERED_NODE_TYPE;

	readonly ANY_TYPE = ANY_TYPE;
	readonly NUMBER_TYPE = NUMBER_TYPE;
	readonly STRING_TYPE = STRING_TYPE;
	readonly BOOLEAN_TYPE = BOOLEAN_TYPE;
	readonly UNORDERED_NODE_ITERATOR_TYPE = UNORDERED_NODE_ITERATOR_TYPE;
	readonly ORDERED_NODE_ITERATOR_TYPE = ORDERED_NODE_ITERATOR_TYPE;
	readonly UNORDERED_NODE_SNAPSHOT_TYPE = UNORDERED_NODE_SNAPSHOT_TYPE;
	readonly ORDERED_NODE_SNAPSHOT_TYPE = ORDERED_NODE_SNAPSHOT_TYPE;
	readonly ANY_UNORDERED_NODE_TYPE = ANY_UNORDERED_NODE_TYPE;
	readonly FIRST_ORDERED_NODE_TYPE = FIRST_ORDERED_NODE_TYPE;

	protected static readonly NODE_SET_RESULT_TYPE = NODE_SET_RESULT_TYPE;

	abstract readonly booleanValue: boolean;
	abstract readonly numberValue: number;
	abstract readonly stringValue: string;
}
