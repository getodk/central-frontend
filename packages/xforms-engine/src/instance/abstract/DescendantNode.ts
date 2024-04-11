import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { BaseNode } from '../../client/BaseNode.ts';
import type { TextRange } from '../../client/TextRange.ts';
import { createComputedExpression } from '../../lib/reactivity/createComputedExpression.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { AnyDescendantNodeDefinition } from '../../model/DescendentNodeDefinition.ts';
import type { AnyNodeDefinition } from '../../model/NodeDefinition.ts';
import type { RepeatInstanceDefinition } from '../../model/RepeatInstanceDefinition.ts';
import type { ValueNodeDefinition } from '../../model/ValueNodeDefinition.ts';
import type { RepeatInstance } from '../RepeatInstance.ts';
import type { RepeatRange } from '../RepeatRange.ts';
import type { Root } from '../Root.ts';
import type { AnyChildNode, GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';
import type { InstanceNodeState, InstanceNodeStateSpec } from './InstanceNode.ts';
import { InstanceNode } from './InstanceNode.ts';

interface DescendantNodeSharedState {
	get reference(): string;
	get readonly(): boolean;
	get relevant(): boolean;
	get required(): boolean;
}

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

export interface DescendantNodeState extends DescendantNodeSharedState, InstanceNodeState {
	get label(): TextRange<'label'> | null;
	get hint(): TextRange<'hint'> | null;
	get children(): readonly AnyChildNode[] | null;
	get valueOptions(): unknown;
	get value(): unknown;
}

// prettier-ignore
export type DescendantNodeDefinition = Extract<
	AnyNodeDefinition,
	AnyDescendantNodeDefinition
>;

// prettier-ignore
export type DescendantNodeParent<Definition extends DescendantNodeDefinition> =
	Definition extends ValueNodeDefinition
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

export abstract class DescendantNode<
		Definition extends DescendantNodeDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Spec extends DescendantNodeStateSpec<any>,
		Child extends AnyChildNode | null = null,
	>
	extends InstanceNode<Definition, Spec, Child>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
	readonly root: Root;
	readonly evaluator: XFormsXPathEvaluator;
	readonly contextNode: Element;

	constructor(
		override readonly parent: DescendantNodeParent<Definition>,
		override readonly definition: Definition
	) {
		super(parent.engineConfig, parent, definition);

		const { evaluator, root } = parent;

		this.root = root;
		this.evaluator = evaluator;
		this.contextNode = this.initializeContextNode(parent.contextNode, definition.nodeName);
	}

	protected computeChildStepReference(parent: DescendantNodeParent<Definition>): string {
		return `${parent.contextReference}/${this.definition.nodeName}`;
	}

	protected abstract override computeReference(
		parent: DescendantNodeParent<Definition>,
		definition: Definition
	): string;

	protected buildSharedStateSpec(
		parent: DescendantNodeParent<Definition>,
		definition: Definition
	): DescendantNodeSharedStateSpec {
		return this.scope.runTask(() => {
			const reference = createMemo(() => this.contextReference);
			const { bind } = definition;

			// TODO: we can likely short-circuit `readonly` computation when a node
			// is non-relevant.
			const selfReadonly = createComputedExpression(this, bind.readonly);
			const readonly = createMemo(() => {
				return parent.isReadonly || selfReadonly();
			});

			const selfRelevant = createComputedExpression(this, bind.relevant);
			const relevant = createMemo(() => {
				return parent.isRelevant && selfRelevant();
			});

			// TODO: we can likely short-circuit `required` computation when a node
			// is non-relevant.
			const required = createComputedExpression(this, bind.required);

			return {
				reference,
				readonly,
				relevant,
				required,
			};
		});
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
