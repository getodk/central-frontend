import type { XFormsXPathEvaluator } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { BaseNode } from '../../client/BaseNode.ts';
import { createComputedExpression } from '../../lib/reactivity/createComputedExpression.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { AnyDescendantNodeDefinition } from '../../model/DescendentNodeDefinition.ts';
import type { LeafNodeDefinition } from '../../model/LeafNodeDefinition.ts';
import type { AnyNodeDefinition } from '../../model/NodeDefinition.ts';
import type { RepeatInstanceDefinition } from '../../model/RepeatInstanceDefinition.ts';
import type { RepeatInstance } from '../RepeatInstance.ts';
import type { RepeatRange } from '../RepeatRange.ts';
import type { Root } from '../Root.ts';
import type { AnyChildNode, GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';
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

// prettier-ignore
export type DescendantNodeDefinition = Extract<
	AnyNodeDefinition,
	AnyDescendantNodeDefinition
>;

// prettier-ignore
export type DescendantNodeParent<Definition extends DescendantNodeDefinition> =
	Definition extends LeafNodeDefinition
		? GeneralParentNode
	: Definition extends RepeatInstanceDefinition
		? RepeatRange
		: GeneralParentNode;

export type AnyDescendantNode = DescendantNode<
	DescendantNodeDefinition,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	DescendantNodeStateSpec<any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any
>;

interface DescendantNodeOptions {
	readonly computeReference?: Accessor<string>;
}

export abstract class DescendantNode<
		Definition extends DescendantNodeDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Spec extends DescendantNodeStateSpec<any>,
		Child extends AnyChildNode | null = null,
	>
	extends InstanceNode<Definition, Spec, Child>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
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

	readonly root: Root;
	readonly evaluator: XFormsXPathEvaluator;
	readonly contextNode: Element;

	constructor(
		override readonly parent: DescendantNodeParent<Definition>,
		override readonly definition: Definition,
		options?: DescendantNodeOptions
	) {
		super(parent.engineConfig, parent, definition, options);

		const { evaluator, root } = parent;

		this.root = root;
		this.evaluator = evaluator;
		this.contextNode = this.initializeContextNode(parent.contextNode, definition.nodeName);

		const { readonly, relevant, required } = definition.bind;

		this.isSelfReadonly = createComputedExpression(this, readonly);
		this.isSelfRelevant = createComputedExpression(this, relevant);
		this.isRequired = createComputedExpression(this, required);
	}

	protected createContextNode(parentContextNode: Element, nodeName: string): Element {
		return parentContextNode.ownerDocument.createElement(nodeName);
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
	protected initializeContextNode(parentContextNode: Element, nodeName: string): Element {
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
