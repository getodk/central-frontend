import type { XPathDOMAdapter } from '../../adapter/interface/XPathDOMAdapter.ts';
import type { XPathNode } from '../../adapter/interface/XPathNode.ts';

const ANY_TYPE: XPathResult['ANY_TYPE'] = 0;
export type ANY_TYPE = typeof ANY_TYPE;

const NUMBER_TYPE: XPathResult['NUMBER_TYPE'] = 1;
export type NUMBER_TYPE = typeof NUMBER_TYPE;

const STRING_TYPE: XPathResult['STRING_TYPE'] = 2;
export type STRING_TYPE = typeof STRING_TYPE;

const BOOLEAN_TYPE: XPathResult['BOOLEAN_TYPE'] = 3;
export type BOOLEAN_TYPE = typeof BOOLEAN_TYPE;

const UNORDERED_NODE_ITERATOR_TYPE: XPathResult['UNORDERED_NODE_ITERATOR_TYPE'] = 4;
export type UNORDERED_NODE_ITERATOR_TYPE = typeof UNORDERED_NODE_ITERATOR_TYPE;

const ORDERED_NODE_ITERATOR_TYPE: XPathResult['ORDERED_NODE_ITERATOR_TYPE'] = 5;
export type ORDERED_NODE_ITERATOR_TYPE = typeof ORDERED_NODE_ITERATOR_TYPE;

const UNORDERED_NODE_SNAPSHOT_TYPE: XPathResult['UNORDERED_NODE_SNAPSHOT_TYPE'] = 6;
export type UNORDERED_NODE_SNAPSHOT_TYPE = typeof UNORDERED_NODE_SNAPSHOT_TYPE;

const ORDERED_NODE_SNAPSHOT_TYPE: XPathResult['ORDERED_NODE_SNAPSHOT_TYPE'] = 7;
export type ORDERED_NODE_SNAPSHOT_TYPE = typeof ORDERED_NODE_SNAPSHOT_TYPE;

const ANY_UNORDERED_NODE_TYPE: XPathResult['ANY_UNORDERED_NODE_TYPE'] = 8;
export type ANY_UNORDERED_NODE_TYPE = typeof ANY_UNORDERED_NODE_TYPE;

const FIRST_ORDERED_NODE_TYPE: XPathResult['FIRST_ORDERED_NODE_TYPE'] = 9;
export type FIRST_ORDERED_NODE_TYPE = typeof FIRST_ORDERED_NODE_TYPE;

export const XPATH_EVALUATION_RESULT = {
	ANY_TYPE,
	ANY_UNORDERED_NODE_TYPE,
	BOOLEAN_TYPE,
	FIRST_ORDERED_NODE_TYPE,
	NUMBER_TYPE,
	ORDERED_NODE_ITERATOR_TYPE,
	ORDERED_NODE_SNAPSHOT_TYPE,
	STRING_TYPE,
	UNORDERED_NODE_ITERATOR_TYPE,
	UNORDERED_NODE_SNAPSHOT_TYPE,
};

export type XPathEvaluationResultType =
	| ANY_TYPE
	| ANY_UNORDERED_NODE_TYPE
	| BOOLEAN_TYPE
	| FIRST_ORDERED_NODE_TYPE
	| NUMBER_TYPE
	| ORDERED_NODE_ITERATOR_TYPE
	| ORDERED_NODE_SNAPSHOT_TYPE
	| STRING_TYPE
	| UNORDERED_NODE_ITERATOR_TYPE
	| UNORDERED_NODE_SNAPSHOT_TYPE;

/**
 * Establishes baseline API compatibility with the WHAT Working Group DOM
 * standard {@link XPathResult}, extended to support any
 * {@link XPathDOMAdapter}'s arbitrary DOM implementation.
 */
export interface XPathEvaluationResult<T extends XPathNode> {
	readonly booleanValue: boolean;
	readonly invalidIteratorState: boolean;
	readonly numberValue: number;
	readonly resultType: XPathEvaluationResultType;
	readonly singleNodeValue: T | null;
	readonly snapshotLength: number;
	readonly stringValue: string;

	readonly ANY_TYPE: ANY_TYPE;
	readonly ANY_UNORDERED_NODE_TYPE: ANY_UNORDERED_NODE_TYPE;
	readonly BOOLEAN_TYPE: BOOLEAN_TYPE;
	readonly FIRST_ORDERED_NODE_TYPE: FIRST_ORDERED_NODE_TYPE;
	readonly NUMBER_TYPE: NUMBER_TYPE;
	readonly ORDERED_NODE_ITERATOR_TYPE: ORDERED_NODE_ITERATOR_TYPE;
	readonly ORDERED_NODE_SNAPSHOT_TYPE: ORDERED_NODE_SNAPSHOT_TYPE;
	readonly STRING_TYPE: STRING_TYPE;
	readonly UNORDERED_NODE_ITERATOR_TYPE: UNORDERED_NODE_ITERATOR_TYPE;
	readonly UNORDERED_NODE_SNAPSHOT_TYPE: UNORDERED_NODE_SNAPSHOT_TYPE;

	iterateNext(): T | null;
	snapshotItem(index: number): T | null;
}
