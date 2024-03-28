import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { BaseNode } from '../../client/BaseNode.ts';
import type { TextRange } from '../../client/TextRange.ts';
import type { AnyDescendantNodeDefinition } from '../../model/DescendentNodeDefinition.ts';
import type { AnyNodeDefinition } from '../../model/NodeDefinition.ts';
import type { RepeatInstanceDefinition } from '../../model/RepeatInstanceDefinition.ts';
import type { RepeatRange } from '../RepeatRange.ts';
import type { Root } from '../Root.ts';
import type { AnyChildNode, GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';
import type { InstanceNodeState } from './InstanceNode.ts';
import { InstanceNode } from './InstanceNode.ts';

export interface DescendantNodeState extends InstanceNodeState {
	get reference(): string;
	get readonly(): boolean;
	get relevant(): boolean;
	get required(): boolean;
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
type DescendantNodeParent<Definition extends DescendantNodeDefinition> =
	Definition extends RepeatInstanceDefinition
		? RepeatRange
		: GeneralParentNode;

export abstract class DescendantNode<
		Definition extends DescendantNodeDefinition,
		State extends DescendantNodeState,
	>
	extends InstanceNode<Definition, State>
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

	/**
	 * Currently expected to be overridden by repeat range.
	 */
	protected initializeContextNode(parentContextNode: Element, nodeName: string): Element {
		const { ownerDocument } = parentContextNode;
		const element = ownerDocument.createElement(nodeName);

		parentContextNode.append(element);

		return element;
	}

	getSubscribableDependencyByReference(_reference: string): SubscribableDependency | null {
		throw new Error('Not implemented');
	}

	subscribe(): void {
		throw new Error('Not implemented');
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
	remove(): void {
		throw new Error('Not implemented');
	}
}
