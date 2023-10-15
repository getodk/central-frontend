import { trimXPathWhitespace } from '../lib/strings/xpath-whitespace.ts';
import { ValueEvaluation } from './ValueEvaluation.ts';

interface NodeEvaluationComputedValues {
	readonly booleanValue: boolean;
	readonly isEmpty: boolean;
	readonly numberValue: number;
	readonly stringValue: string;
}

export class NodeEvaluation extends ValueEvaluation<'NODE'> {
	readonly type = 'NODE';
	readonly nodes: Iterable<Node>;

	protected computedValues: NodeEvaluationComputedValues | null = null;

	protected get booleanValue(): boolean {
		return this.computeValues().booleanValue;
	}

	protected get numberValue(): number {
		return this.computeValues().numberValue;
	}

	protected get stringValue(): string {
		return this.computeValues().stringValue;
	}

	get isEmpty(): boolean {
		return this.computeValues().isEmpty;
	}

	constructor(readonly value: Node) {
		super();
		this.nodes = [value];
	}

	protected computeValues(): NodeEvaluationComputedValues {
		let { computedValues } = this;

		if (computedValues == null) {
			const { value: node } = this;
			const stringValue = node.textContent ?? '';
			const isEmpty = trimXPathWhitespace(stringValue) === '';
			const booleanValue = !isEmpty;

			// Note: without this `isEmpty` check, `Number('')` would produce 0.
			// Which is wrong! Thanks, Netscape!
			const numberValue = isEmpty ? NaN : Number(stringValue);

			computedValues = {
				booleanValue,
				isEmpty,
				numberValue,
				stringValue,
			};

			this.computedValues = computedValues;
		}

		return computedValues;
	}
}
