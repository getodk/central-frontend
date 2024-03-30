import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { BaseNode } from '../../client/BaseNode.ts';
import type { TextRange } from '../../client/TextRange.ts';
import { createComputedExpression } from '../../lib/reactivity/createComputedExpression.ts';
import type { AnyDescendantNodeDefinition } from '../../model/DescendentNodeDefinition.ts';
import type { AnyNodeDefinition } from '../../model/NodeDefinition.ts';
import type { RepeatInstanceDefinition } from '../../model/RepeatInstanceDefinition.ts';
import type { ValueNodeDefinition } from '../../model/ValueNodeDefinition.ts';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDescendantNode = DescendantNode<DescendantNodeDefinition, DescendantNodeStateSpec<any>>;

interface RemoveDescendantNodeOptions {
	readonly isChildRemoval?: boolean;
}

export abstract class DescendantNode<
		Definition extends DescendantNodeDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Spec extends DescendantNodeStateSpec<any>,
	>
	extends InstanceNode<Definition, Spec>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
	readonly root: Root;
	readonly evaluator: XFormsXPathEvaluator;
	readonly contextNode: Element;

	constructor(
		override readonly parent: DescendantNodeParent<Definition>,
		override readonly definition: Definition
	) {
		super(parent.engineConfig, definition);

		const { evaluator, root } = parent;

		this.root = root;
		this.evaluator = evaluator;
		this.contextNode = this.initializeContextNode(parent.contextNode, definition.nodeName);
	}

	protected computeChildStepReference(parent: DescendantNodeParent<Definition>): string {
		return `${parent.contextReference}/${this.definition.nodeName}`;
	}

	protected abstract computeReference(parent: DescendantNodeParent<Definition>): string;

	protected buildSharedStateSpec(
		parent: DescendantNodeParent<Definition>,
		definition: Definition
	): DescendantNodeSharedStateSpec {
		return this.scope.runTask(() => {
			const reference = createMemo(() => this.computeReference(parent));
			const { bind } = definition;

			const selfReadonly = createComputedExpression(this, bind.readonly);
			const readonly = createMemo(() => {
				return parent.isReadonly || selfReadonly();
			});

			const selfRelevant = createComputedExpression(this, bind.relevant);
			const relevant = createMemo(() => {
				return parent.isRelevant && selfRelevant();
			});

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

	getSubscribableDependencyByReference(_reference: string): SubscribableDependency | null {
		throw new Error('Not implemented');
	}

	subscribe(): void {
		throw new Error('Not implemented');
	}

	protected removePrimaryInstanceNode(): void {
		this.contextNode.remove();
	}

	/**
	 * To be called when:
	 *
	 * - the node itself is removed
	 * - a parent/ancestor has been removed(?)
	 *
	 * Implies, at least, a call to `this.scope.dispose()`; possibly make an
	 * exception for repeat instances, which we might want to retain in case
	 * they're re-added. This came up as a behavior of Collect/JavaRosa, and we
	 * should investigate the details and ramifications of that, and whether it's
	 * the desired behavior.
	 */
	remove(this: AnyDescendantNode, options: RemoveDescendantNodeOptions = {}): void {
		const { engineState } = this;

		// No need to recursively remove all descendants from the DOM tree, when
		// the whole subroot will be removed. (This logic might not be totally
		// sound if the reactive scope disposal below is insufficient for cleaning
		// up whatever remaining computations affect those descendants. But it
		// will likely be a safe assumption if we can stop using a backing XML
		// DOM store in the future.)
		if (!options.isChildRemoval) {
			this.removePrimaryInstanceNode();
		}

		this.scope.runTask(() => {
			engineState.children?.forEach((child) => {
				child.remove({
					isChildRemoval: true,
				});
			});
		});

		this.scope.dispose();
	}
}
