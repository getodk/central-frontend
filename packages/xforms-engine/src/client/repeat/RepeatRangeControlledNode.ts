import type { ControlledRepeatDefinition } from '../../parse/model/RepeatDefinition.ts';
import type { BaseRepeatRangeNode, BaseRepeatRangeNodeState } from './BaseRepeatRangeNode.ts';
import type { RepeatRangeUncontrolledNode } from './RepeatRangeUncontrolledNode.ts';

/**
 * {@inheritDoc BaseRepeatRangeNodeState}
 * @see {@link BaseRepeatRangeNodeState}
 */
export interface RepeatRangeControlledState extends BaseRepeatRangeNodeState {}

/**
 * Represents a repeat range whose repeat instances are controlled by the
 * engine, and cannot be added or removed by a client. Functionality and
 * semantics are otherwise consistent with an [uncontrolled]
 * {@link RepeatRangeUncontrolledNode}.
 */
export interface RepeatRangeControlledNode extends BaseRepeatRangeNode {
	readonly nodeType: 'repeat-range:controlled';
	readonly definition: ControlledRepeatDefinition;
}
