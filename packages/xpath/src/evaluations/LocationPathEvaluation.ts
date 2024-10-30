import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { identity } from '@getodk/common/lib/identity.ts';
import type { Temporal } from '@js-temporal/polyfill';
import type { XPathNode } from '../adapter/interface/XPathNode.ts';
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
import { sortDocumentOrder } from '../lib/dom/sort.ts';
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

const isContextNode = <T extends XPathNode>(node: T | null | undefined): node is T => {
	return node != null;
};

type ContextNodeFilter = <T>(node: Iterable<T | null>) => Iterable<NonNullable<T>>;

const filterContextNode = filter(isContextNode) as ContextNodeFilter;

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

type SiblingKey =
	| 'nextElementSibling'
	| 'nextSibling'
	| 'previousElementSibling'
	| 'previousSibling';

function* siblings<T extends XPathNode>(contextNode: T, siblingType: SiblingKey): Iterable<T> {
	let currentNode: T | null | undefined = contextNode;

	while (currentNode != null) {
		currentNode = (currentNode as AdapterElement<T>)[
			siblingType
		] satisfies ChildNode | null as T | null;

		if (isContextNode(currentNode)) {
			yield currentNode;
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

		if (!isNamedStep || isElementNode(contextNode)) {
			yield contextNode;
		}
	},

	attribute: (context) => {
		return context.domProvider.getAttributes(context.contextNode);
	},

	child: function* child<T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): Iterable<T> {
		const { contextNode } = context;

		switch (step.nodeType) {
			case '__NAMED__':
				yield* ((contextNode as AdapterElement<T>).children ?? []) as Iterable<AdapterElement<T>>;
				break;

			default:
				yield* contextNode.childNodes satisfies Iterable<ChildNode> as Iterable<T>;
		}
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
		const { contextDocument, contextNode, rootNode, visited } = context;
		const effectiveContextNode = ((contextNode as AdapterAttribute<T>).ownerElement ??
			contextNode) as T;

		if (visited.has(effectiveContextNode)) {
			return;
		}

		if (
			effectiveContextNode === rootNode ||
			effectiveContextNode === (contextDocument.documentElement as Node as T)
		) {
			return;
		}

		visited.add(effectiveContextNode);

		const { firstChild, nextSibling, parentNode } = effectiveContextNode;

		let currentNodes = filterContextNode([firstChild, nextSibling]) as Iterable<T>;

		if (isContextNode(parentNode as AdapterParentNode<T> | null) && parentNode !== rootNode) {
			const followingParentSiblingsContext = axisEvaluationContext(
				context,
				parentNode as AdapterParentNode<T>
			);
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

	'following-sibling': function* followingSibling(context, step) {
		let siblingKey: SiblingKey;

		if (step.nodeType === '__NAMED__') {
			siblingKey = 'nextElementSibling';
		} else {
			siblingKey = 'nextSibling';
		}

		yield* siblings(context.contextNode, siblingKey);
	},

	namespace: (context) => {
		return context.domProvider.getNamespaceDeclarations(context.contextNode);
	},

	parent: function* parent<T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): Iterable<T> {
		const { rootNode, contextNode } = context;

		if (contextNode === rootNode) {
			return;
		}

		const { ownerElement } = contextNode as AdapterAttribute<T>;

		// Attribute/namespace parent is its owner element
		if (ownerElement != null) {
			yield ownerElement as AdapterElement<T>;

			return;
		}

		let parentNode: T | null;

		if (step.nodeType === '__NAMED__') {
			parentNode = contextNode.parentElement satisfies Node | null as T | null;
		} else {
			parentNode = contextNode.parentNode satisfies Node | null as T | null;
		}

		if (isContextNode(parentNode)) {
			yield parentNode;
		}
	},

	preceding: function* preceding<T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): Iterable<T> {
		const { contextDocument, rootNode, contextNode, visited } = context;
		const effectiveContextNode = ((contextNode as AdapterAttribute<T>).ownerElement ??
			contextNode) as T;

		if (visited.has(effectiveContextNode)) {
			return;
		}

		visited.add(effectiveContextNode);

		if (effectiveContextNode === rootNode) {
			return;
		}

		if (effectiveContextNode === (contextDocument.documentElement as Node as T)) {
			yield* axisEvaluators['preceding-sibling'](context, step);

			return;
		}

		const { lastChild, previousSibling, parentNode } = effectiveContextNode;

		let currentNodes = filterContextNode([lastChild, previousSibling]) as Iterable<T>;

		if (
			effectiveContextNode !== rootNode &&
			isContextNode(parentNode as AdapterParentNode<T> | null) &&
			parentNode !== rootNode
		) {
			const precedingParentSiblingsContext = axisEvaluationContext(
				context,
				parentNode as AdapterParentNode<T>
			);
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

	'preceding-sibling': function* precedingSibling(context, step) {
		let siblingKey: SiblingKey;

		if (step.nodeType === '__NAMED__') {
			siblingKey = 'previousElementSibling';
		} else {
			siblingKey = 'previousSibling';
		}

		yield* siblings(context.contextNode, siblingKey);
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
			nodes = sortDocumentOrder(nodes) satisfies Iterable<Node> as Iterable<T>;
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
