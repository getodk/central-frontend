import type { PrimitiveResultType } from './BaseResult.ts';
import { BaseResult } from './BaseResult.ts';
import type { XPathEvaluationResult } from './XPathEvaluationResult.ts';

class InvalidNodeSetResultError extends Error {
	constructor() {
		super('Result is not a NodeSet');
	}
}

export abstract class PrimitiveResult extends BaseResult implements XPathEvaluationResult {
	abstract override readonly resultType: PrimitiveResultType;

	get singleNodeValue(): Node | null {
		throw new InvalidNodeSetResultError();
	}

	get snapshotLength(): number {
		throw new InvalidNodeSetResultError();
	}

	readonly invalidIteratorState = true;

	iterateNext(): Node | null {
		throw new InvalidNodeSetResultError();
	}

	snapshotItem(_index?: number): Node | null {
		throw new InvalidNodeSetResultError();
	}
}
