import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type {
	ANY_UNORDERED_NODE_TYPE,
	BOOLEAN_TYPE,
	FIRST_ORDERED_NODE_TYPE,
	NUMBER_TYPE,
	ORDERED_NODE_ITERATOR_TYPE,
	ORDERED_NODE_SNAPSHOT_TYPE,
	STRING_TYPE,
	UNORDERED_NODE_ITERATOR_TYPE,
	UNORDERED_NODE_SNAPSHOT_TYPE,
	XPathEvaluationResult,
	XPathEvaluationResultType,
} from './XPathEvaluationResult.ts';
import { XPATH_EVALUATION_RESULT } from './XPathEvaluationResult.ts';

// prettier-ignore
export type PrimitiveResultType =
	| BOOLEAN_TYPE
	| NUMBER_TYPE
	| STRING_TYPE;

// prettier-ignore
export type NodeSetResultType =
	| ANY_UNORDERED_NODE_TYPE
	| FIRST_ORDERED_NODE_TYPE
	| ORDERED_NODE_ITERATOR_TYPE
	| ORDERED_NODE_SNAPSHOT_TYPE
	| UNORDERED_NODE_ITERATOR_TYPE
	| UNORDERED_NODE_SNAPSHOT_TYPE;

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
} = XPATH_EVALUATION_RESULT;

export abstract class BaseResult<T extends XPathNode> implements XPathEvaluationResult<T> {
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

	protected abstract readonly nodes: ReadonlySet<T> | null;

	abstract readonly resultType: XPathEvaluationResultType;
	abstract readonly invalidIteratorState: boolean;
	abstract readonly singleNodeValue: T | null;
	abstract readonly snapshotLength: number;

	abstract readonly booleanValue: boolean;
	abstract readonly numberValue: number;
	abstract readonly stringValue: string;

	abstract iterateNext(): T | null;
	abstract snapshotItem(index: number): T | null;
}
