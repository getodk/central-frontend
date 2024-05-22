import { trimXMLXPathWhitespace } from '@getodk/common/lib/string/whitespace.ts';
import type { LocationPathEvaluation } from './LocationPathEvaluation.ts';
import { StringEvaluation } from './StringEvaluation.ts';
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

	constructor(
		readonly context: LocationPathEvaluation,
		readonly value: Node
	) {
		super();
		this.nodes = [value];
	}

	protected computeValues(): NodeEvaluationComputedValues {
		let { computedValues } = this;

		if (computedValues == null) {
			const { context, value: node } = this;
			const stringValue = node.textContent ?? '';
			const isEmpty = trimXMLXPathWhitespace(stringValue) === '';
			const booleanValue = !isEmpty;
			const numberFunction = context.functions.getDefaultImplementation('number');

			let numberValue: number;

			// Note: without this `isEmpty` check, `Number('')` would produce 0.
			// Which is wrong! Thanks, Netscape!
			if (isEmpty) {
				numberValue = NaN;
			} else if (numberFunction == null) {
				numberValue = Number(stringValue);
			} else {
				const stringEvaluation = new StringEvaluation(context, stringValue);

				numberValue = numberFunction
					.call(context, [
						{
							evaluate: () => stringEvaluation,
						},
					])
					.toNumber();
			}

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
