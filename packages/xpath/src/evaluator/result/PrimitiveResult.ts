import type { XPathResult, XPathResultType } from '../../shared/index.ts';
import type { PrimitiveResultType } from './BaseResult.ts';
import { BaseResult } from './BaseResult.ts';

class InvalidNodeSetResultError extends Error {
	constructor() {
		super('Result is not a NodeSet');
	}
}

export abstract class PrimitiveResult extends BaseResult implements XPathResult {
	protected abstract override readonly type: PrimitiveResultType;

	get resultType(): XPathResultType {
		return this.type;
	}

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
