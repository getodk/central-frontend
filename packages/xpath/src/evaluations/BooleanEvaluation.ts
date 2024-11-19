import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import type { LocationPathEvaluation } from './LocationPathEvaluation.ts';
import { ValueEvaluation } from './ValueEvaluation.ts';

export class BooleanEvaluation<T extends XPathNode> extends ValueEvaluation<T, 'BOOLEAN'> {
	readonly type = 'BOOLEAN';
	readonly nodes = null;

	protected readonly booleanValue: boolean;
	protected readonly numberValue: number;
	protected readonly stringValue: string;

	constructor(
		readonly context: LocationPathEvaluation<T>,
		readonly value: boolean
	) {
		super();

		this.booleanValue = value;
		this.numberValue = value ? 1 : 0;
		this.stringValue = String(value);
	}
}
