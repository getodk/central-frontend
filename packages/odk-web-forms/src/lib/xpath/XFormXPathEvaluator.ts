import { Evaluator } from '@odk/xpath';
import { xpathParser } from './parser.ts';

interface XFormXPathEvaluatorEvaluateOptions<AssertExists extends boolean = false> {
	readonly assertExists?: AssertExists;

	/**
	 * @default rootNode
	 */
	readonly contextNode?: Node;
}

type EvaluatedNode<AssertExists extends boolean, T extends Node> = AssertExists extends true
	? T
	: T | null;

export class XFormXPathEvaluator extends Evaluator {
	constructor(protected readonly rootNode: Element | XMLDocument) {
		super(xpathParser);
	}

	evaluateString(expression: string, options: XFormXPathEvaluatorEvaluateOptions = {}): string {
		return this.evaluate(
			expression,
			options.contextNode ?? this.rootNode,
			null,
			XPathResult.STRING_TYPE
		).stringValue;
	}

	evaluateNode<T extends Node, AssertExists extends boolean = false>(
		expression: string,
		options: XFormXPathEvaluatorEvaluateOptions<AssertExists> = {}
	): EvaluatedNode<AssertExists, T> {
		// TODO: unsafe cast
		const node = this.evaluate(
			expression,
			options.contextNode ?? this.rootNode,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE
		).singleNodeValue as T | null;

		if (!options.assertExists) {
			return node as EvaluatedNode<AssertExists, T>;
		}

		if (node == null) {
			throw new Error(`Failed to evaluate node for expression ${expression}`);
		}

		return node as EvaluatedNode<AssertExists, T>;
	}

	evaluateElement<AssertExists extends boolean = false>(
		expression: string,
		options: XFormXPathEvaluatorEvaluateOptions<AssertExists> = {}
	) {
		return this.evaluateNode<Element, AssertExists>(expression, options);
	}

	evaluateNonNullElement(
		expression: string,
		options: Omit<XFormXPathEvaluatorEvaluateOptions<true>, 'assertExists'> = {}
	): Element {
		return this.evaluateElement<true>(expression, {
			...options,
			assertExists: true,
		});
	}

	evaluateNodes<T extends Node>(
		expression: string,
		options: XFormXPathEvaluatorEvaluateOptions = {}
	): T[] {
		const snapshotResult = this.evaluate(
			expression,
			options.contextNode ?? this.rootNode,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
		);
		const { snapshotLength } = snapshotResult;
		const nodes: T[] = [];

		for (let i = 0; i < snapshotLength; i += 1) {
			nodes.push(
				// TODO: unsafe cast
				snapshotResult.snapshotItem(i) as T
			);
		}

		return nodes;
	}
}
