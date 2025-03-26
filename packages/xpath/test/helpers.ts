import { expect } from 'vitest';
import { DefaultEvaluator } from '../src/evaluator/DefaultEvaluator.ts';
import type { XPathEvaluationResultType } from '../src/evaluator/result/XPathEvaluationResult.ts';
import { TestXFormsXPathEvaluator } from './TestXFormsXPathEvaluator.ts';

// prettier-ignore
type AnyParentNode =
	| Document
	| Element
	| XMLDocument;

declare global {
	/**
	 * The timezone identifier used for all date and time operations in tests.
	 * This string follows the IANA Time Zone Database format (e.g., 'America/Phoenix').
	 * It determines the offset and DST behavior for `Date` objects and
	 * related functions.
	 *
	 * @example 'America/Phoenix' // Fixed UTC-7, no DST
	 * @example 'Europe/London' // UTC+0 (GMT) or UTC+1 (BST) with DST
	 */
	// eslint-disable-next-line no-var
	var TZ: string | undefined;
	/**
	 * The locale string defining the language and regional formatting for tests.
	 * This follows the BCP 47 language tag format (e.g., 'en-US'). It ensures consistent formatting
	 * across tests.
	 *
	 * @example 'en-US' // American English
	 */
	// eslint-disable-next-line no-var
	var LOCALE_ID: string | undefined;
	// eslint-disable-next-line no-var
	var IMPLEMENTATION: string | undefined;
}

globalThis.IMPLEMENTATION = typeof IMPLEMENTATION === 'string' ? IMPLEMENTATION : undefined;
globalThis.TZ = typeof TZ === 'string' ? TZ : undefined;
globalThis.LOCALE_ID = typeof LOCALE_ID === 'string' ? LOCALE_ID : undefined;

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

interface TestContextOptions<XForms extends boolean = false> {
	readonly getRootNode?: (testDocument: XMLDocument) => AnyParentNode;
	readonly namespaceResolver?: Nullish<XPathNSResolver>;
	readonly xforms?: XForms;
}

// prettier-ignore
type TestContextEvaluator<XForms extends boolean> =
	[true] extends [XForms]
		? TestXFormsXPathEvaluator
		: DefaultEvaluator;

export class TestContext<XForms extends boolean = false> {
	readonly document: XMLDocument;
	readonly defaultContextNode: Node;
	readonly evaluator: TestContextEvaluator<XForms>;
	readonly namespaceResolver: XPathNSResolver;

	constructor(
		readonly sourceXML?: string,
		options: TestContextOptions<XForms> = {}
	) {
		const xml = sourceXML ?? '<root/>';
		const testDocument: XMLDocument = domParser.parseFromString(xml, 'text/xml');

		this.document = testDocument;

		const evaluatorOptions = {
			parseOptions: {
				attemptErrorRecovery: true,
			},
			timeZoneId: TZ,
		} as const;

		if (options.xforms) {
			const rootNode = options.getRootNode?.(testDocument) ?? testDocument;
			this.evaluator = new TestXFormsXPathEvaluator({
				...evaluatorOptions,
				rootNode,
			}) satisfies TestContextEvaluator<true>;
			this.defaultContextNode = rootNode;
			this.namespaceResolver = options.namespaceResolver ?? rootNode;
		} else {
			this.evaluator = new DefaultEvaluator(
				evaluatorOptions
			) satisfies TestContextEvaluator<false> as TestContextEvaluator<XForms>;
			this.defaultContextNode = testDocument;
			this.namespaceResolver = options.namespaceResolver ?? namespaceResolver;
		}
	}

	evaluate(
		expression: string,
		contextNode?: Nullish<Node>,
		resultType?: Nullish<XPathEvaluationResultType>,
		// eslint-disable-next-line @typescript-eslint/no-shadow
		namespaceResolver?: Nullish<XPathNSResolver>
	): XPathResult {
		const context = contextNode ?? this.defaultContextNode;

		return this.evaluator.evaluate(
			expression,
			context satisfies Node,
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

		expect(booleanValue, message).toEqual(expected);
	}

	assertNodeSet(
		expression: string,
		expected: readonly Node[],
		options: EvaluationAssertionOptions = {}
	) {
		const nodes = this.evaluateNodeSet(expression, options.contextNode);

		expect(nodes).toEqual(expected);
	}

	assertUnorderedNodeSet(
		expression: string,
		expected: readonly Node[],
		options: EvaluationAssertionOptions = {}
	) {
		const expectedSet = new Set(expected);
		const actual = new Set(this.evaluateUnorderedNodeSet(expression, options.contextNode));

		expect(actual.size).toEqual(expectedSet.size);
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
			expect(numberValue, message).toBeNaN();
		} else {
			expect(numberValue, message).toBe(expected);
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

		expect(Math.round(numberValue * factor) / factor, message).toEqual(expected);
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

		expect(stringValue, message).toEqual(expected);
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

		expect(stringValue.length).toEqual(expected);
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

		expect(stringValue, message).toMatch(pattern);
	}
}

export const createTestContext = (xml?: string, options: TestContextOptions = {}): TestContext => {
	return new TestContext(xml, options);
};

interface XFormsTestContextOptions extends TestContextOptions<true> {
	readonly xforms?: true;
}

export class XFormsTestContext extends TestContext<true> {
	readonly xforms = true;

	constructor(sourceXML?: string, options: XFormsTestContextOptions = {}) {
		super(sourceXML, {
			...options,
			xforms: true,
		});
	}

	setLanguage(language: string | null): string | null {
		return this.evaluator.setActiveLanguage(language);
	}
}

export const createXFormsTestContext = (
	xml?: string,
	options: XFormsTestContextOptions = {}
): XFormsTestContext => {
	return new XFormsTestContext(xml, options);
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
export const createXFormsTextContentTestContext = (textContent: string) => {
	//         ^ Say *that* ten times fast! ;)
	return createXFormsTestContext(/* xml */ `<simple>
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

export const getDefaultDateTimeLocale = (): string => {
	return new Date().toLocaleString(LOCALE_ID, { timeZone: TZ });
};
