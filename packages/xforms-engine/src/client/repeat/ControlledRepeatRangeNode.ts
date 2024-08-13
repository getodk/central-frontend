import type { ControlledRepeatRangeDefinition } from '../../model/RepeatRangeDefinition.ts';
import type { BaseRepeatRangeNode, BaseRepeatRangeNodeState } from './BaseRepeatRangeNode.ts';
import type { RepeatRangeNode } from './RepeatRangeNode.ts';

/**
 * {@inheritDoc BaseRepeatRangeNodeState}
 * @see {@link BaseRepeatRangeNodeState}
 */
export interface ControlledRepeatRangeNodeState extends BaseRepeatRangeNodeState {}

/**
 * Represents a repeat range whose repeat instances are controlled by the
 * engine, and cannot be added or removed by a client. Functionality and
 * semantics are otherwise consistent with an [uncontrolled]
 * {@link RepeatRangeNode}.
 */
export interface ControlledRepeatRangeNode extends BaseRepeatRangeNode {
	readonly countType: 'controlled';
	readonly definition: ControlledRepeatRangeDefinition;
}

export type { RepeatRangeNodeAppearances as ControlledRepeatRangeNodeAppearances } from './BaseRepeatRangeNode.ts';
