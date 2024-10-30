import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { identity } from '@getodk/common/lib/identity.ts';
import type { Temporal } from '@js-temporal/polyfill';
import type { XPathDOMAdapter } from '../adapter/interface/XPathDOMAdapter.ts';
import type {
	UnspecifiedNonXPathNodeKind,
	XPathNode,
	XPathNodeKind,
} from '../adapter/interface/XPathNode.ts';
import type {
	AdapterAttribute,
	AdapterDocument,
	AdapterElement,
	AdapterParentNode,
	AdapterProcessingInstruction,
	AdapterText,
} from '../adapter/interface/XPathNodeKindAdapter.ts';
import type { XPathDOMProvider } from '../adapter/xpathDOMProvider.ts';
import type { Context } from '../context/Context.ts';
import type { EvaluationContext } from '../context/EvaluationContext.ts';
import type { Evaluator } from '../evaluator/Evaluator.ts';
import type { NamespaceResolver } from '../evaluator/NamespaceResolver.ts';
import type { FilterPathExpressionEvaluator } from '../evaluator/expression/FilterPathExpressionEvaluator.ts';
import type { LocationPathEvaluator } from '../evaluator/expression/LocationPathEvaluator.ts';
import type { LocationPathExpressionEvaluator } from '../evaluator/expression/LocationPathExpressionEvaluator.ts';
import type { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import type { NodeSetFunction } from '../evaluator/functions/NodeSetFunction.ts';
import type { AnyStep, AxisType } from '../evaluator/step/Step.ts';
import {
	isAttributeNode,
	isCDataSection,
	isCommentNode,
	isElementNode,
	isProcessingInstructionNode,
	isTextNode,
} from '../lib/dom/predicates.ts';
import { Reiterable } from '../lib/iterators/Reiterable.ts';
import { distinct, filter, tee } from '../lib/iterators/common.ts';
import type { Evaluation } from './Evaluation.ts';
import { NodeEvaluation } from './NodeEvaluation.ts';

function* concat<T>(...iterables: Array<Iterable<T>>): IterableIterator<T> {
	for (const iterable of iterables) {
		yield* iterable;
	}
}

function* flatMapNodeSets<T extends XPathNode>(
	contextNodes: Iterable<T>,
	fn: (contextNode: T) => Iterable<T>
): Iterable<T> {
	for (const contextNode of contextNodes) {
		yield* fn(contextNode);
	}
}

// prettier-ignore
type LocationPathParentContext<T extends XPathNode> =
	| EvaluationContext<T>
	| LocationPathEvaluation<T>;

function* toNodeEvaluations<T extends XPathNode>(
	context: LocationPathEvaluation<T>,
	nodes: Iterable<T>
): Iterable<NodeEvaluation<T>> {
	for (const node of nodes) {
		yield new NodeEvaluation(context, node);
	}
}

type EvaluationComparator<T extends XPathNode> = (
	lhs: Evaluation<T>,
	rhs: Evaluation<T>
) => boolean;

// TODO: we'll be able to optimize this so we don't always need it
type NodeTypeFilter = <T extends XPathNode, U extends T>(nodes: Iterable<T>) => Iterable<U>;

const isNamedNode = <T extends XPathNode>(node: T) => {
	return isElementNode(node) || isAttributeNode(node);
};

const filterNamedNodes = filter(isNamedNode) as NodeTypeFilter;

const filterProcessingInstructionNodes = filter(isProcessingInstructionNode) as NodeTypeFilter;

const filterCommentNodes = filter(isCommentNode) as NodeTypeFilter;

const filterNode = identity as NodeTypeFilter;

const isXPathTextNode = <T extends XPathNode>(node: T): node is AdapterText<T> => {
	return isTextNode(node) || isCDataSection(node);
};

const filterTextNode = filter(isXPathTextNode) as NodeTypeFilter;

const getNodeTypeFilter = (step: AnyStep): NodeTypeFilter => {
	switch (step.nodeType) {
		case '__NAMED__':
			return filterNamedNodes;

		case 'processing-instruction':
			return filterProcessingInstructionNodes;

		case 'comment':
			return filterCommentNodes;

		case 'node':
			return filterNode;

		case 'text':
			return filterTextNode;

		default:
			throw new UnreachableError(step);
	}
};

interface AxisEvaluationCurrentContext<T extends XPathNode> {
	readonly domProvider: XPathDOMProvider<T>;
	readonly contextDocument: AdapterDocument<T>;
	readonly rootNode: AdapterParentNode<T>;
	readonly visited: WeakSet<T>;
}

interface AxisEvaluationContext<T extends XPathNode> extends AxisEvaluationCurrentContext<T> {
	readonly contextNode: T;
}

const axisEvaluationContext = <T extends XPathNode>(
	currentContext: AxisEvaluationCurrentContext<T>,
	contextNode: T
): AxisEvaluationContext<T> => {
	const { domProvider, contextDocument, rootNode, visited } = currentContext;

	return {
		domProvider,
		contextDocument,
		rootNode,
		contextNode,
		visited,
	};
};

type SiblingMethodName =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'getPreviousSiblingNode'
	| 'getPreviousSiblingElement'
	| 'getNextSiblingNode'
	| 'getNextSiblingElement';

function* siblings<T extends XPathNode>(
	context: AxisEvaluationContext<T>,
	methodName: SiblingMethodName
): Iterable<T> {
	const method = context.domProvider[methodName];
	let currentNode: T | null = context.contextNode;

	while (currentNode != null) {
		currentNode = method(currentNode);

		if (currentNode != null) {
			yield currentNode;
		}
	}
}

/**
 * Addresses a nuance of XPath DOM tree structural semantics, affecting the
 * {@link axisEvaluators.following | following} and
 * {@link axisEvaluators.preceding | preceding} axes. Since these axes exclude
 * {@link XPathNamespaceDeclaration | namespace declarations} and
 * {@link XPathAttribute | attributes}, traversal of those axes' nodes begins
 * with their **parent element** (in XPath semantic terms; "owner" element in
 * WHAT Working Group DOM terms).
 *
 * For all other XPath semantic node kinds, the provided {@link contextNode} is
 * returned.
 *
 * This function is intrinsically coupled to both axis implementations. It is
 * defined here to give an explicit name to the concept, and to host this
 * documentation.
 *
 * It is also worth clarifying that neither axis _includes_ the node returned by
 * this function. This is probably what one would expect for the `following`
 * axis: no node is ever followed by its parent in document order. But if one's
 * recall of XPath semantic nuances is rusty, it may be unintuitive (it was for
 * me!) that the namespace/attribute's parent element does not precede it. This
 * text from
 * {@link https://www.w3.org/TR/1999/REC-xpath-19991116/#axes | XPath 1.0 > 2.2 Axes}
 * is helpfully clarifying:
 *
 * > **NOTE:** The `ancestor`, `descendant`, `following`, `preceding` and `self`
 * > axes partition a document (ignoring attribute and namespace nodes): they do
 * > not overlap and together they contain all the nodes in the document.
 */
const getDocumentOrderTraversalContextNode = <T extends XPathNode>(
	domProvider: XPathDOMProvider<T>,
	contextNode: T
): T => {
	if (domProvider.isAttribute(contextNode) || domProvider.isNamespaceDeclaration(contextNode)) {
		const parentElement = domProvider.getParentNode(contextNode);

		domProvider.assertParentNode(parentElement);

		return parentElement;
	}

	return contextNode;
};

function* filterValues<T>(iter: Iterable<T | null | undefined>): IterableIterator<T> {
	for (const item of iter) {
		if (item != null) {
			yield item;
		}
	}
}

/**
 * **!!! HERE BE DRAGONS !!!**
 *
 * This behavior may…
 *
 * - … exceed the XPath 1.0 specification; which in turn may…
 * - … vary (even for the same document) between {@link domAdapter}
 *   implementations, depending on whether they opt to implement
 *   {@link UnspecifiedNonXPathNodeKind}.
 *
 * Specifically, if a {@link documentRoot | document root element} has preceding
 * siblings, adapters **MAY** produce a
 * {@link https://www.w3.org/TR/xml/#dtd | Document Type Declaration (DTD)}
 * node. As described in more detail on {@link UnspecifiedNonXPathNodeKind}:
 *
 * - Per XPath 1.0, DTD nodes are **NOT** considered XPath nodes
 * - Real world XPath implementations **DO** produce DTD nodes nonetheless
 *
 * This behavior is specifically implicated in accommodating that by traversing
 * to applicable nodes as produced by {@link domAdapter}, and then checking that
 * {@link domAdapter} does recognize the node's kind as **either**
 * {@link XPathNodeKind} or {@link UnspecifiedNonXPathNodeKind}. More
 * specifically, this is determined by calling the adapter's
 * {@link XPathDOMAdapter.getNodeKind | getNodeKind} implementation, and
 * checking that it produces a value. If the call returns null (or fails) for a
 * given node, that node will not be produced.
 *
 * @see {@link UnspecifiedNonXPathNodeKind}
 */
function* documentRootPrecedingSiblings<T extends XPathNode>(
	domAdapter: XPathDOMAdapter<T>,
	precedingContext: AxisEvaluationContext<T>,
	documentRoot: T,
	step: AnyStep
): Iterable<T> {
	const documentRootContext = axisEvaluationContext(precedingContext, documentRoot);
	const precedingSiblings = axisEvaluators['preceding-sibling'](documentRootContext, step);

	for (const node of precedingSiblings) {
		// Note: this is likely to be fallible in adapter implementations…
		try {
			if (domAdapter.getNodeKind(node) != null) {
				yield node;
			}
		} catch {
			// … and if it does fail, we should assume the node value is invalid!
		}
	}
}

type EvaluateAxisNodes = <T extends XPathNode>(
	context: AxisEvaluationContext<T>,
	step: AnyStep
) => Iterable<T>;

type AxisEvaluators = Readonly<Record<AxisType, EvaluateAxisNodes>>;

const axisEvaluators: AxisEvaluators = {
	ancestor: function* ancestor(context, step) {
		const { rootNode } = context;
		const parentNodes = axisEvaluators.parent(context, step);

		for (const parentNode of parentNodes) {
			if (parentNode !== rootNode) {
				const parentContext = axisEvaluationContext(context, parentNode);

				yield* axisEvaluators.ancestor(parentContext, step);
			}

			yield parentNode;
		}
	},

	'ancestor-or-self': function* ancestorOrSelf(context, step) {
		const { contextNode } = context;
		const isNamedStep = step.stepType !== 'NodeTypeTest';
		const currentContext = axisEvaluationContext(context, contextNode);

		yield* axisEvaluators.ancestor(currentContext, step);

		if (!isNamedStep || context.domProvider.isElement(contextNode)) {
			yield contextNode;
		}
	},

	attribute: (context) => {
		return context.domProvider.getAttributes(context.contextNode);
	},

	child: (context, step) => {
		const { contextNode, domProvider } = context;

		if (step.nodeType === '__NAMED__') {
			return domProvider.getChildElements(contextNode);
		}

		return domProvider.getChildNodes(contextNode);
	},

	descendant: function* descendant(context, step) {
		for (const childNode of axisEvaluators.child(context, step)) {
			yield childNode;

			const childContext = axisEvaluationContext(context, childNode);

			yield* axisEvaluators.descendant(childContext, step);
		}
	},

	'descendant-or-self': function* descendantOrSelf(context, step) {
		const { contextNode } = context;

		yield contextNode;

		const selfContext = axisEvaluationContext(context, contextNode);

		yield* axisEvaluators.descendant(selfContext, step);
	},

	following: function* following<T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): Iterable<T> {
		const { domProvider, contextDocument, rootNode } = context;
		const contextNode = getDocumentOrderTraversalContextNode(domProvider, context.contextNode);

		if (context.visited.has(contextNode)) {
			return;
		}

		context.visited.add(contextNode);

		const parentNode = domProvider.getParentNode(contextNode);

		if (contextNode === rootNode || parentNode === contextDocument) {
			return;
		}

		let firstChild: T | null;
		let nextSibling: T | null = null;

		if (step.nodeType === '__NAMED__') {
			firstChild = domProvider.getFirstChildElement(contextNode);
			nextSibling = domProvider.getNextSiblingElement(contextNode);
		} else {
			firstChild = domProvider.getFirstChildNode(contextNode);
			nextSibling = domProvider.getNextSiblingNode(contextNode);
		}

		let currentNodes = filterValues([firstChild, nextSibling]);

		if (parentNode != null && parentNode !== rootNode) {
			const followingParentSiblingsContext = axisEvaluationContext(context, parentNode);
			const followingParentSiblings = axisEvaluators['following-sibling'](
				followingParentSiblingsContext,
				step
			);

			currentNodes = concat(currentNodes, followingParentSiblings);
		}

		for (const currentNode of currentNodes) {
			yield currentNode;

			const currentContext = axisEvaluationContext(context, currentNode);

			yield* axisEvaluators.following(currentContext, step);
		}
	},

	'following-sibling': (context, step) => {
		if (step.nodeType === '__NAMED__') {
			return siblings(context, 'getNextSiblingElement');
		}

		return siblings(context, 'getNextSiblingNode');
	},

	namespace: (context) => {
		return context.domProvider.getNamespaceDeclarations(context.contextNode);
	},

	parent: function* parent(context) {
		const { rootNode, contextNode } = context;

		if (contextNode === rootNode) {
			return;
		}

		const parentNode = context.domProvider.getParentNode(contextNode);

		if (parentNode != null) {
			yield parentNode;
		}
	},

	preceding: function* preceding<T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): Iterable<T> {
		const { domProvider, rootNode, contextDocument, visited } = context;
		const contextNode = getDocumentOrderTraversalContextNode(domProvider, context.contextNode);

		if (visited.has(contextNode)) {
			return;
		}

		visited.add(contextNode);

		if (contextNode === rootNode) {
			return;
		}

		const parentNode = domProvider.getParentNode(contextNode);

		if (parentNode === contextDocument) {
			yield* documentRootPrecedingSiblings(domProvider, context, contextNode, step);

			return;
		}

		let lastChild: T | null;
		let previousSibling: T | null;

		if (step.nodeType === '__NAMED__') {
			previousSibling = domProvider.getPreviousSiblingElement(contextNode);
			lastChild = domProvider.getLastChildElement(contextNode);
		} else {
			previousSibling = domProvider.getPreviousSiblingNode(contextNode);
			lastChild = domProvider.getLastChildNode(contextNode);
		}

		if (lastChild === contextNode) {
			lastChild = null;
		}

		let currentNodes = filterValues([lastChild, previousSibling]);

		if (contextNode !== rootNode && parentNode != null && parentNode !== rootNode) {
			const precedingParentSiblingsContext = axisEvaluationContext(context, parentNode);
			const precedingParentSiblings = axisEvaluators['preceding-sibling'](
				precedingParentSiblingsContext,
				step
			);

			currentNodes = concat(currentNodes, precedingParentSiblings);
		}

		for (const currentNode of currentNodes) {
			yield currentNode;

			const currentContext = axisEvaluationContext(context, currentNode);

			yield* preceding(currentContext, step);
		}
	},

	'preceding-sibling': (context, step) => {
		if (step.nodeType === '__NAMED__') {
			return siblings(context, 'getPreviousSiblingElement');
		}

		return siblings(context, 'getPreviousSiblingNode');
	},

	self: function* self(context) {
		yield context.contextNode;
	},
};

interface LocationPathEvaluationOptions {
	readonly contextPosition?: number;

	contextSize?: () => number;
}

type ArbitraryNodesTemporaryCallee =
	| FilterPathExpressionEvaluator
	| LocationPathEvaluator
	| NodeSetFunction;

type AssertLocationPathEvaluationInstance = <T extends XPathNode>(
	context: EvaluationContext<T>,
	value: unknown,
	message?: string
) => asserts value is LocationPathEvaluation<T>;

// TODO: naming, general design/approach. This class has multiple, overlapping
// purposes:
//
// 1. Initial and intermediate context during a given evaluation of a given
//    location path. Intermediate in the sense that evaluating a location path
//    with multiple steps will produce instances for each step. Context in the
//    sense described by XPath, and the interface named `Context`.
//
// 2. An evaluation value, i.e. "node-set" in the XForms spec and a candidate
//    for concretion as an XPath result (also per spec) at a given expression's
//    terminus. In fact, an earlier iteration used the name `NodeSet` for this
//    reason. The current name took its place because of its responsibility for
//    providing context to location paths generally, and because it is
//    inherently also an evaluation which can be used to produce a result
//    (again, in the sense defined by the XPath spec).
//
// 3. As an internal implementation detail, an iterable instance over its
//    individual contextualized node values (contextualized in the sense that a
//    given node value has a position and a context size).
//
// It's tempting to break this up into any one or two of these responsibilities.
// This is exactly how it was implemented in earlier prototyping. But the
// implementation kept "wanting" to be a singular *thing*. In the course of
// evaluating location path steps, it most makes sense for this to be a context.
// In the course of evaluating sub-expressions (function arguments, predicates),
// it most makes sense for this to be an evaluation. Any breaking up from that
// perspective ultimately produces two "things" which convert between one
// another... because they really are different views on the same data.
//
// It's also tempting to keep the shared responsibilities in a single "thing",
// but to break those responsibilities up into sub-structures. That would be
// satisfying, but it would come with a bunch of coupling between those
// sub-structures to satisfy the various interfaces expecting some or all of
// this behavior/structure.
export class LocationPathEvaluation<T extends XPathNode>
	implements
		Evaluation<T, 'NODE'>,
		Context<T>,
		EvaluationContext<T>,
		Iterable<LocationPathEvaluation<T>>
{
	protected static isInstance<T extends XPathNode>(
		context: Context<T>,
		value: unknown
	): value is LocationPathEvaluation<T> {
		return value instanceof LocationPathEvaluation && value.domProvider === context.domProvider;
	}

	static readonly assertInstance: AssertLocationPathEvaluationInstance = (
		context,
		value,
		message
	) => {
		if (!this.isInstance(context, value)) {
			throw new Error(message ?? 'Expected a node-set result');
		}
	};

	// --- DOM adapter/provider ---
	readonly domProvider: XPathDOMProvider<T>;

	// --- Evaluation ---
	readonly type = 'NODE';

	protected readonly nodeEvaluations: Reiterable<NodeEvaluation<T>>;

	// --- Context ---
	readonly evaluator: Evaluator<T>;
	readonly context: LocationPathEvaluation<T> = this;

	/**
	 * @see {@link Context.evaluationContextNode}
	 */
	readonly evaluationContextNode: T;

	readonly contextDocument: AdapterDocument<T>;
	readonly rootNode: AdapterParentNode<T>;

	private _nodes: Iterable<T>;

	get nodes(): Iterable<T> {
		return this._nodes;
	}

	get contextNodes(): IterableIterator<T> {
		const [nodes, contextNodes] = tee(this._nodes);

		this._nodes = nodes;

		return contextNodes;
	}

	protected computedContextSize: number | null = null;

	protected readonly optionsContextSize?: () => number;
	protected readonly initializedContextPosition: number;

	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: NamespaceResolver<T>;

	readonly timeZone: Temporal.TimeZone;

	/**
	 * TODO: this is a temporary accommodation for these cases which are presently
	 * not especially well designed:
	 *
	 * - Functions returning node-sets (i.e. {@link NodeSetFunction} instances).
	 *   It may make sense to invert control, invoking them from here?
	 *
	 * - Nodes filtered by predicate in {@link LocationPathExpression}. Such
	 *   filtering almost certainly should be performed here, in {@link step}.
	 */
	static fromArbitraryNodes<T extends XPathNode>(
		currentContext: LocationPathParentContext<T>,
		nodes: Iterable<T>,
		_temporaryCallee: ArbitraryNodesTemporaryCallee
	): LocationPathEvaluation<T> {
		return new this(currentContext, nodes);
	}

	static fromCurrentContext<T extends XPathNode>(
		evaluationContext: EvaluationContext<T>
	): LocationPathEvaluation<T> {
		let options: LocationPathEvaluationOptions | undefined;

		if (evaluationContext instanceof LocationPathEvaluation) {
			options = {
				get contextPosition() {
					return evaluationContext.contextPosition();
				},
				contextSize() {
					return evaluationContext.contextSize();
				},
			};
		}

		return new this(evaluationContext, evaluationContext.contextNodes, options);
	}

	static fromRoot<T extends XPathNode>(
		parentContext: LocationPathParentContext<T>
	): LocationPathEvaluation<T> {
		return new this(parentContext, [parentContext.rootNode]);
	}

	protected constructor(
		readonly parentContext: LocationPathParentContext<T>,
		contextNodes: Iterable<T>,
		options: LocationPathEvaluationOptions = {}
	) {
		this.domProvider = parentContext.domProvider;

		const {
			evaluator,
			contextDocument,
			evaluationContextNode,
			functions,
			namespaceResolver,
			rootNode,
			timeZone,
		} = parentContext;

		this.evaluator = evaluator;
		this.contextDocument = contextDocument;
		this.evaluationContextNode = evaluationContextNode;
		this.functions = functions;
		this.namespaceResolver = namespaceResolver;
		this.rootNode = rootNode;
		this.timeZone = timeZone;

		const [nodes] = tee(distinct(contextNodes));

		this._nodes = nodes;

		this.nodeEvaluations = Reiterable.from(toNodeEvaluations(this, contextNodes));

		if (options.contextSize != null) {
			this.optionsContextSize = options.contextSize;
		} else if (Array.isArray(contextNodes)) {
			this.computedContextSize = contextNodes.length;
		}

		this.initializedContextPosition = options.contextPosition ?? 1;
	}

	[Symbol.iterator]() {
		const nodes = this.contextNodes;

		let contextPosition = this.contextPosition();

		return {
			next: (): IteratorResult<LocationPathEvaluation<T>> => {
				const next = nodes.next();

				if (next.done) {
					return next;
				}

				const value = new LocationPathEvaluation(this, [next.value], {
					contextPosition,
					contextSize: () => {
						return this.contextSize();
					},
				});

				contextPosition += 1;

				return {
					done: false,
					value,
				};
			},
		};
	}

	values(): Iterable<NodeEvaluation<T>> {
		return this.nodeEvaluations;
	}

	contextPosition(): number {
		return this.initializedContextPosition;
	}

	contextSize(): number {
		const { optionsContextSize } = this;

		if (optionsContextSize != null) {
			return optionsContextSize();
		}

		let { computedContextSize } = this;

		if (computedContextSize == null) {
			const { contextNodes } = this;

			computedContextSize = [...contextNodes].length;
			this.computedContextSize = computedContextSize;
		}

		return computedContextSize;
	}

	currentContext<U extends XPathNode>(this: LocationPathEvaluation<U>): LocationPathEvaluation<U> {
		return LocationPathEvaluation.fromCurrentContext<U>(this);
	}

	rootContext<U extends XPathNode>(this: LocationPathEvaluation<U>): LocationPathEvaluation<U> {
		return LocationPathEvaluation.fromRoot<U>(this);
	}

	protected _first?: NodeEvaluation<T> | null;

	first(): NodeEvaluation<T> | null {
		let result = this._first;

		if (typeof result !== 'undefined') {
			return result;
		}

		result = this.nodeEvaluations.first() ?? null;
		this._first = result;

		return result;
	}

	protected _isEmpty: boolean | null = null;

	protected isEmpty(): boolean {
		let result = this._isEmpty;

		if (result != null) {
			return result;
		}

		result = this.first() == null;
		this._isEmpty = result;

		return result;
	}

	some(predicate: (evaluation: NodeEvaluation<T>) => boolean): boolean {
		return this.nodeEvaluations.some(predicate);
	}

	toBoolean(): boolean {
		return !this.isEmpty();
	}

	toNumber(): number {
		return this.first()?.toNumber() ?? NaN;
	}

	toString(): string {
		return this.first()?.toString() ?? '';
	}

	protected compare(comparator: EvaluationComparator<T>, operand: Evaluation<T>) {
		if (operand instanceof LocationPathEvaluation) {
			return this.some((lhs) => operand.some((rhs) => comparator(lhs, rhs)));
		}

		return this.some((lhs) => comparator(lhs, operand));
	}

	eq(operand: Evaluation<T>): boolean {
		if (operand.type === 'BOOLEAN') {
			return this.toBoolean() === operand.toBoolean();
		}

		return this.compare((lhs, rhs) => lhs.eq(rhs), operand);
	}

	ne(operand: Evaluation<T>): boolean {
		if (operand.type === 'BOOLEAN') {
			return this.toBoolean() !== operand.toBoolean();
		}

		return this.compare((lhs, rhs) => lhs.ne(rhs), operand);
	}

	lt(operand: Evaluation<T>): boolean {
		return this.compare((lhs, rhs) => lhs.lt(rhs), operand);
	}

	lte(operand: Evaluation<T>): boolean {
		return this.compare((lhs, rhs) => lhs.lte(rhs), operand);
	}

	gt(operand: Evaluation<T>): boolean {
		return this.compare((lhs, rhs) => lhs.gt(rhs), operand);
	}

	gte(operand: Evaluation<T>): boolean {
		return this.compare((lhs, rhs) => lhs.gte(rhs), operand);
	}

	step(step: AnyStep): LocationPathEvaluation<T> {
		/** @todo remove */
		type MaybeNamedNode = AdapterAttribute<T> | AdapterElement<T>;

		let nodesFilter: (nodes: Iterable<T>) => Iterable<T> = identity;

		const { namespaceResolver } = this;

		switch (step.stepType) {
			case 'NodeTypeTest':
				break;

			case 'NodeNameTest': {
				const { nodeName } = step;
				const nullNamespaceURI = namespaceResolver.lookupNamespaceURI(null);

				nodesFilter = filter((node: T) => {
					const { namespaceURI } = node as MaybeNamedNode;

					return (
						(node as MaybeNamedNode).localName === nodeName &&
						(namespaceURI == null || namespaceURI === nullNamespaceURI)
					);
				});

				break;
			}

			case 'ProcessingInstructionNameTest': {
				const { processingInstructionName } = step;

				nodesFilter = filter((node: T) => {
					return (node as AdapterProcessingInstruction<T>).nodeName === processingInstructionName;
				});

				break;
			}

			case 'QualifiedNameTest': {
				const { prefix, localName } = step;
				const namespaceURI = namespaceResolver.lookupNamespaceURI(prefix);

				nodesFilter = filter(
					(node: T) =>
						(node as MaybeNamedNode).localName === localName &&
						(node as MaybeNamedNode).namespaceURI === namespaceURI
				);

				break;
			}

			case 'QualifiedWildcardTest': {
				const { prefix } = step;
				const namespaceURI = namespaceResolver.lookupNamespaceURI(prefix);

				nodesFilter = filter((node: T) => (node as MaybeNamedNode).namespaceURI === namespaceURI);

				break;
			}

			case 'UnqualifiedWildcardTest':
				break;

			default:
				throw new UnreachableError(step);
		}

		const { axisType } = step;
		const axisEvaluator = axisEvaluators[axisType];
		const context: AxisEvaluationCurrentContext<T> = {
			domProvider: this.domProvider,
			rootNode: this.rootNode,
			contextDocument: this.contextDocument,
			visited: new WeakSet(),
		};
		const nodeTypeFilter = getNodeTypeFilter(step);

		let nodes = flatMapNodeSets(this.contextNodes, function* (contextNode) {
			const currentContext = axisEvaluationContext(context, contextNode);
			const axisNodes = axisEvaluator(currentContext, step);
			const typedNodes = nodeTypeFilter(axisNodes);

			yield* nodesFilter(typedNodes);
		});

		// TODO: this is out of spec! Tests currently depend on it. We could update
		// the tests, but making the minimal change necessary for refactor to
		// eliminate use of TreeWalker
		if (axisType === 'preceding' || axisType === 'preceding-sibling') {
			nodes = this.domProvider.sortInDocumentOrder(nodes);
		}

		return new LocationPathEvaluation(this, nodes);
	}

	evaluateLocationPathExpression(
		expression: LocationPathExpressionEvaluator
	): LocationPathEvaluation<T> {
		const nodes = expression.evaluateNodes(this);

		return new LocationPathEvaluation(this, nodes);
	}
}
