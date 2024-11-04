import { XPathNodeKindKey, type XPathDOMAdapter } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { BaseNode } from '../../client/BaseNode.ts';
import type { ActiveLanguage } from '../../client/FormLanguage.ts';
import type { InstanceNodeType } from '../../client/node-types.ts';
import type {
	XFormsXPathPrimaryInstanceDescendantNode,
	XFormsXPathPrimaryInstanceDescendantNodeKind,
} from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import { XFORMS_XPATH_NODE_RANGE_KIND } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import { createComputedExpression } from '../../lib/reactivity/createComputedExpression.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { AnyDescendantNodeDefinition } from '../../parse/model/DescendentNodeDefinition.ts';
import type { AnyNodeDefinition } from '../../parse/model/NodeDefinition.ts';
import type { AnyChildNode, AnyNode, AnyParentNode, RepeatRange } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';
import type { RepeatInstance } from '../repeat/RepeatInstance.ts';
import type { Root } from '../Root.ts';
import type { InstanceNodeContextNodeKind, InstanceNodeStateSpec } from './InstanceNode.ts';
import { InstanceNode } from './InstanceNode.ts';

export interface DescendantNodeSharedStateSpec {
	readonly reference: Accessor<string>;
	readonly readonly: Accessor<boolean>;
	readonly relevant: Accessor<boolean>;
	readonly required: Accessor<boolean>;
}

// prettier-ignore
export type DescendantNodeStateSpec<Value = never> =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	& InstanceNodeStateSpec<Value>
	& DescendantNodeSharedStateSpec;

// prettier-ignore
export type DescendantNodeDefinition = Extract<
	AnyNodeDefinition,
	AnyDescendantNodeDefinition
>;

export type AnyDescendantNode = DescendantNode<
	DescendantNodeDefinition,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	DescendantNodeStateSpec<any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any
>;

/**
 * @see {@link InstanceNodeContextNodeKind}
 *
 * @todo We can't extend this to include {@link Attr} yet, nor can we make {@link DescendantNode} generic over it yet. But both will be easier to do, once we finish the migration to {@link XPathDOMAdapter}.
 */
type DescendantNodeContextNodeKind = Element;

interface DescendantNodeOptions {
	readonly computeReference?: Accessor<string>;
}

export abstract class DescendantNode<
		Definition extends DescendantNodeDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Spec extends DescendantNodeStateSpec<any>,
		Parent extends AnyParentNode,
		Child extends AnyChildNode | null = null,
	>
	extends InstanceNode<Definition, Spec, Parent, Child, DescendantNodeContextNodeKind>
	implements
		BaseNode,
		XFormsXPathPrimaryInstanceDescendantNode,
		EvaluationContext,
		SubscribableDependency
{
	/**
	 * Partial implementation of {@link isAttached}, used to check whether `this`
	 * is present in {@link parent}'s children state.
	 */
	protected readonly isAttachedDescendant: Accessor<boolean>;

	readonly hasReadonlyAncestor: Accessor<boolean> = () => {
		const { parent } = this;

		return parent.hasReadonlyAncestor() || parent.isReadonly();
	};

	readonly isSelfReadonly: Accessor<boolean>;

	readonly isReadonly: Accessor<boolean> = () => {
		if (this.hasReadonlyAncestor()) {
			return true;
		}

		return this.isSelfReadonly();
	};

	readonly hasNonRelevantAncestor: Accessor<boolean> = () => {
		const { parent } = this;

		return parent.hasNonRelevantAncestor() || !parent.isRelevant();
	};

	readonly isSelfRelevant: Accessor<boolean>;

	readonly isRelevant: Accessor<boolean> = () => {
		if (this.hasNonRelevantAncestor()) {
			return false;
		}

		return this.isSelfRelevant();
	};

	readonly isRequired: Accessor<boolean>;

	// XFormsXPathPrimaryInstanceDescendantNode

	/**
	 * WARNING! Ideally, this would be an abstract property, defined by each
	 * concrete subclass (or other intermediate abstract classes, where
	 * appropriate). Unfortunately it must be assigned here, so it will be present
	 * for certain XPath DOM adapter functionality **during** each concrete node's
	 * construction.
	 *
	 * Those subclasses nevertheless override this same property, assigning the
	 * same value, for the purposes of narrowing the XPath node kind semantics
	 * appropriate for each node type.
	 */
	override readonly [XPathNodeKindKey]: XFormsXPathPrimaryInstanceDescendantNodeKind;
	readonly root: Root;

	// BaseNode
	abstract override readonly nodeType: InstanceNodeType;

	// EvaluationContext
	readonly isAttached: Accessor<boolean>;
	readonly evaluator: EngineXPathEvaluator;
	readonly contextNode: Element;
	readonly getActiveLanguage: Accessor<ActiveLanguage>;

	constructor(
		override readonly parent: Parent,
		override readonly definition: Definition,
		options?: DescendantNodeOptions
	) {
		super(parent.engineConfig, parent, definition, options);

		if (this.isRoot()) {
			this.root = this;
		} else {
			this.root = parent.root;
		}

		const { evaluator } = parent;

		// See notes on property declaration
		if (definition.type === 'repeat-range') {
			this[XPathNodeKindKey] = XFORMS_XPATH_NODE_RANGE_KIND;
		} else {
			this[XPathNodeKindKey] = 'element';
		}

		const self = this as AnyDescendantNode as AnyChildNode;

		this.isAttachedDescendant = this.scope.runTask(() => {
			return createMemo(() => {
				for (const child of parent.getChildren()) {
					if (child === self) {
						return true;
					}
				}

				return false;
			});
		});

		this.isAttached = this.scope.runTask(() => {
			return createMemo(() => {
				return this.parent.isAttached() && this.isAttachedDescendant();
			});
		});

		this.evaluator = evaluator;
		this.getActiveLanguage = parent.getActiveLanguage;
		this.contextNode = this.initializeContextNode(parent.contextNode, definition.nodeName);

		const { readonly, relevant, required } = definition.bind;

		this.isSelfReadonly = createComputedExpression(this, readonly, {
			defaultValue: true,
		});
		this.isSelfRelevant = createComputedExpression(this, relevant, {
			defaultValue: false,
		});
		this.isRequired = createComputedExpression(this, required, {
			defaultValue: false,
		});
	}

	protected createContextNode(parentContextNode: Document | Element, nodeName: string): Element {
		const contextDocument = parentContextNode.ownerDocument ?? parentContextNode;

		return contextDocument.createElement(nodeName);
	}

	// EvaluationContext: node-relative
	/** @todo remove */
	getSubscribableDependenciesByReference(
		this: AnyNode,
		reference: string
	): readonly SubscribableDependency[] {
		return this.rootDocument.getSubscribableDependenciesByReference(reference);
	}

	/**
	 * Currently expected to be overridden by...
	 *
	 * - Repeat range: returns its parent's context node, because it doesn't have
	 *   a node in the primary instance tree.
	 *
	 * - Repeat instance: returns its created context node, but overrides handles
	 *   appending behavior separately (for inserting at the end of its parent
	 *   range, or even at an arbitrary index within the range, after instance
	 *   creation is has completed).
	 */
	protected initializeContextNode(
		parentContextNode: Parent['contextNode'],
		nodeName: string
	): Element {
		const element = this.createContextNode(parentContextNode, nodeName);

		parentContextNode.append(element);

		return element;
	}

	/**
	 * @package
	 *
	 * Performs recursive removal, first of the node's descendants, then of the
	 * node itself. For all {@link DescendantNode}s, removal involves **at least**
	 * disposal of its {@link scope} ({@link ReactiveScope}).
	 *
	 * It is expected that the outermost node targeted for removal will always be
	 * a {@link RepeatInstance}. @see {@link RepeatInstance.remove} for additional
	 * details.
	 *
	 * It is also expected that upon that outermost node's removal, its parent
	 * {@link RepeatRange} will perform a reactive update to its children state so
	 * that:
	 *
	 * 1. Any downstream computations affected by the removal are updated.
	 * 2. The client invoking removal is also reactively updated (where
	 *    applicable).
	 *
	 * @see {@link RepeatInstance.remove} and {@link RepeatRange.removeInstances}
	 * for additional details about their respective node-specific removal
	 * behaviors and ordering.
	 *
	 * @todo Possibly retain removed repeat instances in memory. This came up as a
	 * behavior of Collect/JavaRosa, and we should investigate the details and
	 * ramifications of that, and whether it's the desired behavior.
	 */
	remove(this: AnyChildNode): void {
		this.scope.runTask(() => {
			this.getChildren().forEach((child) => {
				child.remove();
			});
		});

		this.scope.dispose();
	}
}
