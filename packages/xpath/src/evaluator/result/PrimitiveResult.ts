import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { PrimitiveResultType } from './BaseResult.ts';
import { BaseResult } from './BaseResult.ts';
import type { XPathEvaluationResult } from './XPathEvaluationResult.ts';

class InvalidNodeSetResultError extends Error {
	constructor() {
		super('Result is not a NodeSet');
	}
}

export abstract class PrimitiveResult<T extends XPathNode>
	extends BaseResult<T>
	implements XPathEvaluationResult<T>
{
	abstract override readonly resultType: PrimitiveResultType;

	get singleNodeValue(): T | null {
		throw new InvalidNodeSetResultError();
	}

	get snapshotLength(): number {
		throw new InvalidNodeSetResultError();
	}

	readonly invalidIteratorState = true;

	iterateNext(): T | null {
		throw new InvalidNodeSetResultError();
	}

	snapshotItem(_index?: number): T | null {
		throw new InvalidNodeSetResultError();
	}
}
