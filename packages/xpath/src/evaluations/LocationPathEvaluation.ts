import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { identity } from '@getodk/common/lib/identity.ts';
import type { Temporal } from '@js-temporal/polyfill';
import type { Context } from '../context/Context.ts';
import type {
	EvaluationContext,
	EvaluationContextTreeWalkers,
} from '../context/EvaluationContext.ts';
import type { Evaluator } from '../evaluator/Evaluator.ts';
import type { FilterPathExpressionEvaluator } from '../evaluator/expression/FilterPathExpressionEvaluator.ts';
import type { LocationPathEvaluator } from '../evaluator/expression/LocationPathEvaluator.ts';
import type { LocationPathExpressionEvaluator } from '../evaluator/expression/LocationPathExpressionEvaluator.ts';
import type { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import type { NodeSetFunction } from '../evaluator/functions/NodeSetFunction.ts';
import type { AnyStep } from '../evaluator/step/Step.ts';
import { isAttributeNode, isElementNode, isNamespaceAttribute } from '../lib/dom/predicates.ts';
import type {
	ContextDocument,
	ContextNode,
	ContextParentNode,
	MaybeAttrNode,
	MaybeElementNode,
	MaybeNamedNode,
	MaybeProcessingInstructionNode,
} from '../lib/dom/types.ts';
import { Reiterable } from '../lib/iterators/Reiterable.ts';
import { distinct, filter, map, tee } from '../lib/iterators/common.ts';
import type { XPathNamespaceResolverObject } from '../shared/interface.ts';
import type { Evaluation } from './Evaluation.ts';
import { NodeEvaluation } from './NodeEvaluation.ts';

type LocationPathParentContext = EvaluationContext | LocationPathEvaluation;

function* toNodeEvaluations(
	context: LocationPathEvaluation,
	nodes: Iterable<ContextNode>
): Iterable<NodeEvaluation> {
	for (const node of nodes) {
		yield new NodeEvaluation(context, node);
	}
}

type EvaluationComparator = (lhs: Evaluation, rhs: Evaluation) => boolean;

const filterNamespace = filter(isNamespaceAttribute);

const filterNonNamespace = filter((attr: Attr) => !isNamespaceAttribute(attr));

const filterNonAttribute = filter((node: Node) => !isAttributeNode(node));

export enum AxisName {
	ANCESTOR = 'ancestor',
	ANCESTOR_OR_SELF = 'ancestor-or-self',
	ATTRIBUTE = 'attribute',
	CHILD = 'child',
	DESCENDANT = 'descendant',
	DESCENDANT_OR_SELF = 'descendant-or-self',
	FOLLOWING = 'following',
	FOLLOWING_SIBLING = 'following-sibling',
	NAMESPACE = 'namespace',
	PARENT = 'parent',
	PRECEDING = 'preceding',
	PRECEDING_SIBLING = 'preceding-sibling',
	SELF = 'self',
}

// prettier-ignore
type AxisMethod = {
	[Name in AxisName]: Name extends `${infer Prefix}-or-self`
		? `${Prefix}OrSelf`
			: Name extends `${infer Prefix}-sibling`
		? `${Prefix}Sibling`
			: `${Name}`;
}[AxisName];

interface LocationStep extends Readonly<Record<AxisName, AxisMethod>> {}

const axisNameToMethod: LocationStep = {
	[AxisName.ANCESTOR]: 'ancestor',
	[AxisName.ANCESTOR_OR_SELF]: 'ancestorOrSelf',
	[AxisName.ATTRIBUTE]: 'attribute',
	[AxisName.CHILD]: 'child',
	[AxisName.DESCENDANT]: 'descendant',
	[AxisName.DESCENDANT_OR_SELF]: 'descendantOrSelf',
	[AxisName.FOLLOWING]: 'following',
	[AxisName.FOLLOWING_SIBLING]: 'followingSibling',
	[AxisName.NAMESPACE]: 'namespace',
	[AxisName.PARENT]: 'parent',
	[AxisName.PRECEDING]: 'preceding',
	[AxisName.PRECEDING_SIBLING]: 'precedingSibling',
	[AxisName.SELF]: 'self',
};

interface LocationPathEvaluationOptions {
	readonly contextPosition?: number;

	contextSize?: () => number;
}

type ArbitraryNodesTemporaryCallee =
	| FilterPathExpressionEvaluator
	| LocationPathEvaluator
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	| NodeSetFunction<any>;

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
export class LocationPathEvaluation
	implements Evaluation<'NODE'>, Context, Iterable<LocationPathEvaluation>
{
	// --- Evaluation ---
	readonly type = 'NODE';

	protected readonly nodeEvaluations: Reiterable<NodeEvaluation>;

	// --- Context ---
	readonly evaluator: Evaluator;
	readonly context: LocationPathEvaluation = this;

	/**
	 * @see {@link Context.evaluationContextNode}
	 */
	readonly evaluationContextNode: ContextNode;

	readonly contextDocument: ContextDocument;
	readonly rootNode: ContextParentNode;

	nodes: Iterable<ContextNode>;

	get contextNodes(): IterableIterator<ContextNode> {
		const [nodes, contextNodes] = tee(this.nodes);

		this.nodes = nodes;

		return contextNodes;
	}

	protected computedContextSize: number | null = null;

	protected readonly optionsContextSize?: () => number;
	protected readonly initializedContextPosition: number;

	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: XPathNamespaceResolverObject;

	readonly treeWalkers: EvaluationContextTreeWalkers;

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
	static fromArbitraryNodes(
		currentContext: LocationPathParentContext,
		nodes: Iterable<ContextNode>,
		_temporaryCallee: ArbitraryNodesTemporaryCallee
	): LocationPathEvaluation {
		return new this(currentContext, nodes);
	}

	static fromCurrentContext(evaluationContext: EvaluationContext): LocationPathEvaluation {
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

	static fromRoot(parentContext: LocationPathParentContext): LocationPathEvaluation {
		return new this(parentContext, [parentContext.rootNode]);
	}

	protected constructor(
		readonly parentContext: LocationPathParentContext,
		contextNodes: Iterable<ContextNode>,
		options: LocationPathEvaluationOptions = {}
	) {
		const {
			evaluator,
			contextDocument,
			evaluationContextNode,
			functions,
			namespaceResolver,
			rootNode,
			timeZone,
			treeWalkers,
		} = parentContext;

		this.evaluator = evaluator;
		this.contextDocument = contextDocument;
		this.evaluationContextNode = evaluationContextNode;
		this.functions = functions;
		this.namespaceResolver = namespaceResolver;
		this.rootNode = rootNode;
		this.timeZone = timeZone;
		this.treeWalkers = treeWalkers;

		const [nodes] = tee(distinct(contextNodes));

		this.nodes = nodes;

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
			next: (): IteratorResult<LocationPathEvaluation> => {
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

	values(): Iterable<NodeEvaluation> {
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

	currentContext(): LocationPathEvaluation {
		return LocationPathEvaluation.fromCurrentContext(this);
	}

	rootContext(): LocationPathEvaluation {
		return LocationPathEvaluation.fromRoot(this);
	}

	protected _first?: NodeEvaluation | null;

	first(): NodeEvaluation | null {
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

	some(predicate: (evaluation: NodeEvaluation) => boolean): boolean {
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

	protected compare(comparator: EvaluationComparator, operand: Evaluation) {
		if (operand instanceof LocationPathEvaluation) {
			return this.some((lhs) => operand.some((rhs) => comparator(lhs, rhs)));
		}

		return this.some((lhs) => comparator(lhs, operand));
	}

	eq(operand: Evaluation): boolean {
		if (operand.type === 'BOOLEAN') {
			return this.toBoolean() === operand.toBoolean();
		}

		return this.compare((lhs, rhs) => lhs.eq(rhs), operand);
	}

	ne(operand: Evaluation): boolean {
		if (operand.type === 'BOOLEAN') {
			return this.toBoolean() !== operand.toBoolean();
		}

		return this.compare((lhs, rhs) => lhs.ne(rhs), operand);
	}

	lt(operand: Evaluation): boolean {
		return this.compare((lhs, rhs) => lhs.lt(rhs), operand);
	}

	lte(operand: Evaluation): boolean {
		return this.compare((lhs, rhs) => lhs.lte(rhs), operand);
	}

	gt(operand: Evaluation): boolean {
		return this.compare((lhs, rhs) => lhs.gt(rhs), operand);
	}

	gte(operand: Evaluation): boolean {
		return this.compare((lhs, rhs) => lhs.gte(rhs), operand);
	}

	protected getTreeWalker(step: AnyStep): TreeWalker {
		const { treeWalkers } = this;

		switch (step.nodeType) {
			case '__NAMED__':
				return treeWalkers.ELEMENT;

			case 'comment':
				return treeWalkers.COMMENT;

			case 'node':
				return treeWalkers.ANY;

			case 'processing-instruction':
				return treeWalkers.PROCESSING_INSTRUCTION;

			case 'text':
				return treeWalkers.TEXT;

			default:
				throw new UnreachableError(step);
		}
	}

	protected *ancestor(step: AnyStep): Iterable<ContextNode> {
		const { rootNode } = this;

		const parents = this.parent(step);

		for (const parent of parents) {
			if (parent !== rootNode) {
				const parentContext = new LocationPathEvaluation(this, [parent]);

				yield* parentContext.ancestor(step);
			}

			yield parent;
		}
	}

	protected *ancestorOrSelf(step: AnyStep): Iterable<ContextNode> {
		const isNamedStep = step.stepType !== 'NodeTypeTest';

		for (const self of this) {
			yield* self.ancestor(step);

			for (const node of self.contextNodes) {
				if (!isNamedStep || isElementNode(node)) {
					yield node;
				}
			}
		}
	}

	protected *attribute(): Iterable<ContextNode> {
		for (const node of this.contextNodes) {
			yield* filterNonNamespace((node as MaybeElementNode).attributes ?? []);
		}
	}

	protected *child(step: AnyStep): Iterable<ContextNode> {
		const treeWalker = this.getTreeWalker(step);

		for (const node of this.contextNodes) {
			let currentNode: Node = node;

			treeWalker.currentNode = currentNode;
			treeWalker.firstChild();

			do {
				currentNode = treeWalker.currentNode;

				// `TreeWalker` "child" and "sibling" are lies. They will both happily
				// enter descendants of those childrens to match their initial filter.
				//
				// TODO: as such, this check is *necessary*, but probably so expensive
				// it may negate the benefits of using `TreeWalker` versus other
				// traversal/filtering techniques. That said, it would be worth
				// exploring the use of a `Set<ChildNode>` for this check to see if it
				// negates the presumed performance impact.
				if (currentNode.parentNode === node) {
					yield currentNode as ContextNode;
					treeWalker.currentNode = currentNode;
				}
			} while (treeWalker.nextSibling() != null);
		}
	}

	protected *descendant(step: AnyStep): Iterable<ContextNode> {
		const treeWalker = this.getTreeWalker(step);

		for (const node of this.contextNodes) {
			treeWalker.currentNode = node;

			if (treeWalker.firstChild() == null) {
				continue;
			}

			do {
				const { currentNode } = treeWalker;

				// Might be more efficient to "clone" the `TreeWalker` with each node
				// as its root, than repeatedly performing this check...
				if (!node.contains(currentNode)) {
					break;
				}

				yield currentNode as ContextNode;
				treeWalker.currentNode = currentNode;
			} while (treeWalker.nextNode() != null);
		}
	}

	protected *descendantOrSelf(step: AnyStep): Iterable<ContextNode> {
		for (const self of this) {
			yield* self.contextNodes;

			yield* self.descendant(step);
		}
	}

	protected *following(step: AnyStep): Iterable<ContextNode> {
		const contextNodes = map((node: Node) => (node as MaybeAttrNode).ownerElement ?? node)(
			this.contextNodes
		);

		const treeWalker = this.getTreeWalker(step);
		const visited = new WeakSet<Node>();

		for (const node of contextNodes) {
			const { nextSibling } = node;

			if (nextSibling == null) {
				continue;
			}

			treeWalker.currentNode = nextSibling;

			do {
				const { currentNode } = treeWalker;

				if (visited.has(currentNode)) {
					continue;
				}

				visited.add(currentNode);

				yield currentNode as ContextNode;
				treeWalker.currentNode = currentNode;
			} while (treeWalker.nextNode() != null);
		}
	}

	protected *followingSibling(step: AnyStep): Iterable<ContextNode> {
		const visited = new WeakSet<Node>();
		const treeWalker = this.getTreeWalker(step);

		for (const node of this.contextNodes) {
			const { nextSibling } = node;

			if (nextSibling == null) {
				continue;
			}

			const { parentNode } = node;

			treeWalker.currentNode = nextSibling;

			do {
				const { currentNode } = treeWalker;

				if (visited.has(currentNode) || currentNode.parentNode !== parentNode) {
					continue;
				}

				visited.add(currentNode);

				yield currentNode as ContextNode;
				treeWalker.currentNode = currentNode;
			} while (treeWalker.nextSibling() != null);
		}
	}

	protected *namespace(): Iterable<ContextNode> {
		for (const node of this.contextNodes) {
			yield* filterNamespace((node as MaybeElementNode).attributes ?? []);
		}
	}

	protected *parent(step: AnyStep): Iterable<ContextNode> {
		const { contextNodes, rootNode } = this;
		const treeWalker = this.getTreeWalker(step);

		for (const node of contextNodes) {
			const contextNode = (node as MaybeAttrNode).ownerElement ?? node;

			if (contextNode === rootNode) {
				continue;
			}

			if (contextNode !== node) {
				yield contextNode;

				continue;
			}

			treeWalker.currentNode = contextNode;

			const parentNode = treeWalker.parentNode();

			if (parentNode != null) {
				yield parentNode as ContextNode;
				treeWalker.currentNode = parentNode;
			}
		}
	}

	protected *preceding(step: AnyStep): Iterable<ContextNode> {
		const { rootNode } = this;
		const { nodeType = null } = step;
		const treeWalker = this.getTreeWalker(step);

		treeWalker.currentNode = rootNode;

		// The idea is that it applies the `TreeWalker`'s filter to select the
		// pertinent `currentNode` when `rootNode` otherwise wouldn't have matched.
		// It probably also performs poorly!
		if (nodeType != null && nodeType !== 'node') {
			treeWalker.nextNode();
			treeWalker.previousNode();
		}

		for (const node of this.contextNodes) {
			const contextNode = (node as MaybeAttrNode).ownerElement ?? node;

			do {
				const { currentNode } = treeWalker;

				if (currentNode.contains(contextNode)) {
					continue;
				}

				if (
					currentNode === contextNode ||
					(contextNode.compareDocumentPosition(currentNode) & Node.DOCUMENT_POSITION_PRECEDING) ===
						0
				) {
					break;
				}

				yield currentNode as ContextNode;
				treeWalker.currentNode = currentNode;
			} while (treeWalker.nextNode() != null);
		}
	}

	protected *precedingSibling(step: AnyStep): Iterable<ContextNode> {
		const { nodeType = null } = step;
		const treeWalker = this.getTreeWalker(step);

		let parentNode: Node | null = null;

		for (const node of filterNonAttribute(this.contextNodes)) {
			const currentParentNode = node.parentNode;

			if (currentParentNode == null) {
				continue;
			}

			if (currentParentNode !== parentNode) {
				parentNode = currentParentNode;

				// Safe, otherwise we wouldn't have a parent node!
				treeWalker.currentNode = parentNode.firstChild!;

				// See commentary on same logic under `preceding`
				if (nodeType != null && nodeType !== 'node') {
					treeWalker.nextSibling();
					treeWalker.previousSibling();
				}
			}

			do {
				const { currentNode } = treeWalker;

				if (currentNode === node) {
					break;
				}

				yield currentNode as ContextNode;
				treeWalker.currentNode = currentNode;
			} while (treeWalker.nextSibling() != null);
		}
	}

	protected *self(): Iterable<ContextNode> {
		yield* this.contextNodes;
	}

	step(step: AnyStep): LocationPathEvaluation {
		let nodesFilter: (nodes: Iterable<ContextNode>) => Iterable<ContextNode> = identity;

		const { namespaceResolver } = this;

		switch (step.stepType) {
			case 'NodeTypeTest':
				break;

			case 'NodeNameTest': {
				const { nodeName } = step;
				const nullNamespaceURI = namespaceResolver.lookupNamespaceURI(null);

				nodesFilter = filter((node: ContextNode) => {
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

				nodesFilter = filter((node: ContextNode) => {
					return (node as MaybeProcessingInstructionNode).nodeName === processingInstructionName;
				});

				break;
			}

			case 'QualifiedNameTest': {
				const { prefix, localName } = step;
				const namespaceURI = namespaceResolver.lookupNamespaceURI(prefix);

				nodesFilter = filter(
					(node: ContextNode) =>
						(node as MaybeNamedNode).localName === localName &&
						(node as MaybeNamedNode).namespaceURI === namespaceURI
				);

				break;
			}

			case 'QualifiedWildcardTest': {
				const { prefix } = step;
				const namespaceURI = namespaceResolver.lookupNamespaceURI(prefix);

				nodesFilter = filter(
					(node: ContextNode) => (node as MaybeNamedNode).namespaceURI === namespaceURI
				);

				break;
			}

			case 'UnqualifiedWildcardTest':
				break;

			default:
				throw new UnreachableError(step);
		}

		const { axisType } = step;
		const axisMethod = axisNameToMethod[axisType];

		const nodes: Iterable<ContextNode> = nodesFilter(this[axisMethod](step));

		return new LocationPathEvaluation(this, nodes);
	}

	evaluateLocationPathExpression(
		expression: LocationPathExpressionEvaluator
	): LocationPathEvaluation {
		const nodes = expression.evaluateNodes(this);

		return new LocationPathEvaluation(this, nodes as Iterable<ContextNode>);
	}
}
