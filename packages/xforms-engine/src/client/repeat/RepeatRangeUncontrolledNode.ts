import type { UncontrolledRepeatDefinition } from '../../parse/model/RepeatDefinition.ts';
import type { PageBoundary } from '../identity.ts';
import type { RootNode } from '../RootNode.ts';
import type { BaseRepeatRangeNode, BaseRepeatRangeNodeState } from './BaseRepeatRangeNode.ts';

/**
 * {@inheritDoc BaseRepeatRangeNodeState}
 * @see {@link BaseRepeatRangeNodeState}
 */
export interface RepeatRangeUncontrolledState extends BaseRepeatRangeNodeState {
  /**
   * The page this repeat belongs to: the field-list page containing it, or — outside any
   * field-list — its own page, which exists only while the repeat has no instances.
   */
  get pageBoundary(): PageBoundary;
}

/**
 * {@inheritDoc BaseRepeatRangeNode}
 * @see {@link BaseRepeatRangeNode}
 */
export interface RepeatRangeUncontrolledNode extends BaseRepeatRangeNode {
  readonly nodeType: 'repeat-range:uncontrolled';
  readonly definition: UncontrolledRepeatDefinition;
  readonly currentState: RepeatRangeUncontrolledState;

  addInstances(afterIndex?: number, count?: number): RootNode;
  removeInstances(startIndex: number, count?: number): RootNode;
}
