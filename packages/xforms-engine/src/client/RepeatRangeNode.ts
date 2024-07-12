import type { RepeatRangeDefinition } from '../model/RepeatRangeDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { NodeAppearances } from './NodeAppearances.ts';
import type { RepeatInstanceNode } from './RepeatInstanceNode.ts';
import type { RootNode } from './RootNode.ts';
import type { TextRange } from './TextRange.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { AncestorNodeValidationState } from './validation.ts';

export interface RepeatRangeNodeState extends BaseNodeState {
	get hint(): null;
	get label(): TextRange<'label'> | null;

	/**
	 * A repeat range's children may only be {@link RepeatInstanceNode}s.
	 *
	 * Note: the web-forms engine's representation of this structure differs from
	 * the underlying XForms specification's primary instance structure.
	 *
	 * @see {@link RepeatRangeNode} for additional detail.
	 */
	get children(): readonly RepeatInstanceNode[];

	get valueOptions(): null;
	get value(): null;
}

export type RepeatRangeNodeAppearances = NodeAppearances<RepeatRangeDefinition>;

/**
 * Represents a contiguous set of zero or more {@link RepeatInstanceNode}s
 * (accessed by its
 * {@link RepeatRangeNodeState.children | `currentState.children`}).
 *
 * This structure is modeled as a node, like any other, in the web-forms engine
 * representation, which notably differs from the corresponding structure in the
 * underlying ODK XForms specification's primary instance state.
 *
 * _Conceptually_, it more closely corresponds to the concept of a set of
 * repeats as defined by a `<repeat>` element in the XForms body. Whereas its
 * {@link RepeatInstanceNode} children, if any, correspond directly to the
 * XForms primary instance's state.
 *
 * More precisely, clients should be advised that the presentation aspect of a
 * `RepeatRangeNode` corresponds to a pair of
 * {@link https://getodk.github.io/xforms-spec/#body-elements | `<group>` and `<repeat>` body elements}
 * referencing the same nodeset. (Forms which define a repeat without a
 * corresponding group are semantically equivalent to those with this
 * group/repeat pair. The web-forms engine model simplifies this by producing
 * the same runtime structure for either case.)
 *
 * @example
 *
 * To illustrate the structural divergence from the underlying XForms concepts,
 * consider this (abridged) XForm definition:
 *
 * ```xml
 * <!-- /h:html/h:head/model -->
 * <instance>
 *   <data>
 *     <rep />
 *   </data>
 * </instance>
 * <!-- /h:html/h:body -->
 * <repeat nodeset="/data/rep" />
 * ```
 *
 * The engine's representation maps to that structure roughly like:
 *
 * ```xml
 * <!-- /h:html/h:head/model -->
 * <instance>
 *   <data>
 *     <!-- RepeatRangeNode(/data/rep).currentState.children: [ -->
 *       <!-- RepeatInstanceNode(/data/rep[1]): --> <rep />
 *       <!-- RepeatInstanceNode(/data/rep[2]): --> <rep />
 *       <!-- ... -->
 *     <!-- ] -->
 *   </data>
 * </instance>
 * <!-- /h:html/h:body -->
 * <!-- RepeatRangeNode(/data/rep).definition: { ... -->
 *   <group ref="/data/rep">
 *     <repeat nodeset="/data/rep" />
 *   </group>
 * <!-- } -->
 * ```
 *
 * Importantly, if the state of a given repeat range has no instances, no aspect
 * of these repeats will be present in the underlying XForms primary instance
 * state, but the web-forms engine's representations **retains a reference** to
 * its {@link RepeatRangeNode}.
 */
export interface RepeatRangeNode extends BaseNode {
	readonly nodeType: 'repeat-range';
	readonly appearances: RepeatRangeNodeAppearances;
	readonly definition: RepeatRangeDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: RepeatRangeNodeState;
	readonly validationState: AncestorNodeValidationState;

	addInstances(afterIndex?: number, count?: number): RootNode;

	removeInstances(startIndex: number, count?: number): RootNode;
}
