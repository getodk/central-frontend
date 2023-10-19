import type { LocationPathEvaluation } from './LocationPathEvaluation.ts';
import { ValueEvaluation } from './ValueEvaluation.ts';

export class NumberEvaluation extends ValueEvaluation<'NUMBER'> {
	readonly type = 'NUMBER';
	readonly nodes = null;

	protected readonly booleanValue: boolean;
	protected readonly numberValue: number;
	protected readonly stringValue: string;

	constructor(
		readonly context: LocationPathEvaluation,
		readonly value: number
	) {
		super();

		this.booleanValue = value !== 0 && !Number.isNaN(value);
		this.numberValue = value;
		this.stringValue = String(value);
	}
}
