import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { BaseNode } from '../../client/BaseNode.ts';
import type { ActiveLanguage } from '../../client/FormLanguage.ts';
import type { InstanceNodeType } from '../../client/node-types.ts';
import type { PrimaryInstanceXPathChildNode } from '../../integration/xpath/adapter/kind.ts';
import type {
	XFormsXPathPrimaryInstanceDescendantNode,
	XFormsXPathPrimaryInstanceDescendantNodeKind,
} from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import { XFORMS_XPATH_NODE_RANGE_KIND } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { createComputedExpression } from '../../lib/reactivity/createComputedExpression.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { AnyNodeDefinition } from '../../parse/model/NodeDefinition.ts';
import type { DescendantNodeInitOptions } from '../children/DescendantNodeInitOptions.ts';
import type { AnyChildNode, AnyParentNode, RepeatRange } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { RepeatInstance } from '../repeat/RepeatInstance.ts';
import type { Root } from '../Root.ts';
import type { InstanceNodeStateSpec } from './InstanceNode.ts';
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

export type DescendantNodeDefinition = AnyNodeDefinition;

export type AnyDescendantNode = DescendantNode<
	DescendantNodeDefinition,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	DescendantNodeStateSpec<any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any
>;

interface DescendantNodeOptions {
	readonly computeReference?: Accessor<string>;
}

/**
 * @todo Unify constructor signatures of {@link DescendantNode} and its
 * subclasses, which will simplify the branchy logic of child node construction
 * and minimize internal churn as common themes evolve. A good starting point is
 * beginning to form in {@link DescendantNodeInitOptions} (not to be confused
 * with the current module-local {@link DescendantNodeOptions}).
 */
export abstract class DescendantNode<
		Definition extends DescendantNodeDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Spec extends DescendantNodeStateSpec<any>,
		Parent extends AnyParentNode,
		Child extends AnyChildNode | null = null,
	>
	extends InstanceNode<Definition, Spec, Parent, Child>
	implements BaseNode, XFormsXPathPrimaryInstanceDescendantNode, EvaluationContext
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
	override readonly contextNode: PrimaryInstanceXPathChildNode =
		this as AnyDescendantNode as PrimaryInstanceXPathChildNode;
	readonly getActiveLanguage: Accessor<ActiveLanguage>;

	constructor(
		override readonly parent: Parent,
		override readonly instanceNode: StaticElement | null,
		override readonly definition: Definition,
		options?: DescendantNodeOptions
	) {
		super(parent.instanceConfig, parent, instanceNode, definition, options);

		if (this.isRoot()) {
			this.root = this;
		} else {
			this.root = parent.root;
		}

		const { evaluator } = parent;

		// See notes on property declaration
		if (definition.type === 'repeat') {
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
