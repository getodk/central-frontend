import { expect } from 'vitest';
import { Evaluator } from '../src/index.ts';
import type { AnyXPathEvaluator, XPathResultType } from '../src/shared/interface.ts';

declare global {
	// eslint-disable-next-line no-var
	var TZ: string | undefined;
	// eslint-disable-next-line no-var
	var IMPLEMENTATION: string | undefined;
}

globalThis.IMPLEMENTATION = typeof IMPLEMENTATION === 'string' ? IMPLEMENTATION : undefined;
globalThis.TZ = typeof TZ === 'string' ? TZ : undefined;

const namespaces: Record<string, string> = {
	xhtml: 'http://www.w3.org/1999/xhtml',
	mathml: 'http://www.w3.org/1998/Math/MathML',
	jr: 'http://openrosa.org/javarosa',
};

export const namespaceResolver: XPathNSResolver = {
	lookupNamespaceURI: (prefix?: string | null) => {
		return namespaces[prefix ?? ''] ?? null;
	},
};

const domParser = new DOMParser();

type Nullish<T> = T | null | undefined;

interface EvaluationAssertionOptions {
	readonly contextNode?: Nullish<Node>;
	readonly namespaceResolver?: Nullish<XPathNSResolver>;

	readonly message?: string;
}

interface TestContextOptions {
	readonly namespaceResolver?: Nullish<XPathNSResolver>;
}

export class TestContext {
	readonly document: XMLDocument;
	readonly evaluator: AnyXPathEvaluator;
	readonly namespaceResolver: XPathNSResolver;

	constructor(
		readonly sourceXML?: string,
		options: TestContextOptions = {}
	) {
		const xml = sourceXML ?? '<root/>';

		const evaluator = new Evaluator({
			parseOptions: {
				attemptErrorRecovery: true,
			},
			timeZoneId: TZ,
		});

		this.document = domParser.parseFromString(xml, 'text/xml');
		this.evaluator = evaluator;
		this.namespaceResolver = options.namespaceResolver ?? namespaceResolver;
	}

	evaluate(
		expression: string,
		contextNode?: Nullish<Node>,
		resultType?: Nullish<XPathResultType>,
		// eslint-disable-next-line @typescript-eslint/no-shadow
		namespaceResolver?: Nullish<XPathNSResolver>
	): XPathResult {
		const context = contextNode ?? this.document;

		return this.evaluator.evaluate(
			expression,
			context,
			namespaceResolver ?? this.namespaceResolver ?? context,
			resultType ?? XPathResult.ANY_TYPE
		);
	}

	evaluateNodeSet(expression: string, contextNode?: Nullish<Node>): readonly Node[] {
		const nodes: Node[] = [];

		const result = this.evaluate(
			expression,
			contextNode,
			XPathResult.ORDERED_NODE_ITERATOR_TYPE,
			namespaceResolver
		);

		let node: Node | null;

		while ((node = result.iterateNext()) != null) {
			nodes.push(node);
		}

		return nodes;
	}

	evaluateUnorderedNodeSet(expression: string, contextNode?: Nullish<Node>): readonly Node[] {
		const nodes: Node[] = [];

		const result = this.evaluate(
			expression,
			contextNode,
			XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
			namespaceResolver
		);

		let node: Node | null;

		while ((node = result.iterateNext()) != null) {
			nodes.push(node);
		}

		return nodes;
	}

	assertBooleanValue(
		expression: string,
		expected: boolean,
		options: EvaluationAssertionOptions = {}
	) {
		const { booleanValue } = this.evaluate(
			expression,
			options.contextNode,
			XPathResult.BOOLEAN_TYPE,
			options.namespaceResolver
		);

		const { message } = options;

		expect(booleanValue, message).to.equal(expected);
	}

	assertNodeSet(
		expression: string,
		expected: readonly Node[],
		options: EvaluationAssertionOptions = {}
	) {
		const nodes = this.evaluateNodeSet(expression, options.contextNode);

		expect(nodes).to.deep.equal(expected);
	}

	assertUnorderedNodeSet(
		expression: string,
		expected: readonly Node[],
		options: EvaluationAssertionOptions = {}
	) {
		const expectedSet = new Set(expected);
		const actual = new Set(this.evaluateUnorderedNodeSet(expression, options.contextNode));

		expect(actual.size).to.equal(expectedSet.size);
		expect(expected.every((node) => actual.has(node)));
	}

	assertNumberValue(
		expression: string,
		expected: number,
		options: EvaluationAssertionOptions = {}
	) {
		const { numberValue } = this.evaluate(
			expression,
			options.contextNode,
			XPathResult.NUMBER_TYPE,
			options.namespaceResolver
		);

		const { message } = options;

		if (Number.isNaN(expected)) {
			expect(numberValue, message).to.be.NaN;
		} else {
			expect(numberValue, message).to.equal(expected);
		}
	}

	assertNumberRounded(
		expression: string,
		expected: number,
		factor: number,
		options: EvaluationAssertionOptions = {}
	) {
		const { numberValue } = this.evaluate(
			expression,
			options.contextNode,
			XPathResult.NUMBER_TYPE,
			options.namespaceResolver
		);

		const { message } = options;

		expect(Math.round(numberValue * factor) / factor, message).to.equal(expected);
	}

	assertStringValue(
		expression: string,
		expected: string,
		options: EvaluationAssertionOptions = {}
	) {
		const { stringValue } = this.evaluate(
			expression,
			options.contextNode,
			XPathResult.STRING_TYPE,
			options.namespaceResolver
		);

		const { message } = options;

		expect(stringValue, message).to.equal(expected);
	}

	assertStringLength(
		expression: string,
		expected: number,
		options: EvaluationAssertionOptions = {}
	) {
		const { stringValue } = this.evaluate(
			expression,
			options.contextNode,
			XPathResult.STRING_TYPE,
			options.namespaceResolver
		);

		expect(stringValue.length).to.equal(expected);
	}

	assertStringMatches(
		expression: string,
		pattern: RegExp,
		options: EvaluationAssertionOptions = {}
	) {
		const { stringValue } = this.evaluate(
			expression,
			options.contextNode,
			XPathResult.STRING_TYPE,
			options.namespaceResolver
		);

		const { message } = options;

		expect(stringValue, message).to.match(pattern);
	}

	assertThrows(): never {
		throw '';
	}
}

export const createTestContext = (xml?: string, options: TestContextOptions = {}): TestContext => {
	return new TestContext(xml, options);
};

/**
 * Creates a text context to evaluate expressions against a document with a
 * predictable structure:
 *
 * ```xml
 * <simple>
 *  <xpath>
 *    <to>
 *      <node>${textContent}</node>
 *    </to>
 *  </xpath>
 *  <empty />
 * </simple>
 * ```
 */
export const createTextContentTestContext = (textContent: string) => {
	//         ^ Say *that* ten times fast! ;)
	return createTestContext(/* xml */ `<simple>
    <xpath>
      <to>
        <node>${textContent}</node>
      </to>
    </xpath>
    <empty />
  </simple>`);
};

export const getNonNamespaceAttributes = (element: Element): readonly Attr[] => {
	const attrs = Array.from(element.attributes);

	return attrs.filter(({ name }) => name !== 'xmlns' && !name.startsWith('xmlns:'));
};
