import type { UncontrolledRepeatRangeDefinition } from '../../model/RepeatRangeDefinition.ts';
import type { RootNode } from '../RootNode.ts';
import type { BaseRepeatRangeNode, BaseRepeatRangeNodeState } from './BaseRepeatRangeNode.ts';

/**
 * {@inheritDoc BaseRepeatRangeNodeState}
 * @see {@link BaseRepeatRangeNodeState}
 */
export interface RepeatRangeNodeState extends BaseRepeatRangeNodeState {}

/**
 * {@inheritDoc BaseRepeatRangeNode}
 * @see {@link BaseRepeatRangeNode}
 */
export interface RepeatRangeNode extends BaseRepeatRangeNode {
	readonly countType: 'uncontrolled';
	readonly definition: UncontrolledRepeatRangeDefinition;

	addInstances(afterIndex?: number, count?: number): RootNode;
	removeInstances(startIndex: number, count?: number): RootNode;
}

export type { RepeatRangeNodeAppearances } from './BaseRepeatRangeNode.ts';
