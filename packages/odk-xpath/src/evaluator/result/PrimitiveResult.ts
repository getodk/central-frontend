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

	protected readonly invalidNodeSetResultError: Error = new InvalidNodeSetResultError();

	get singleNodeValue(): Node | null {
		throw this.invalidNodeSetResultError;
	}

	get snapshotLength(): number {
		throw this.invalidNodeSetResultError;
	}

	readonly invalidIteratorState = true;

	iterateNext(): Node | null {
		throw this.invalidNodeSetResultError;
	}

	snapshotItem(_index?: number): Node | null {
		throw this.invalidNodeSetResultError;
	}
}
