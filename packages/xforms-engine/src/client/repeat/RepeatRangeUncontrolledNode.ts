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
   * The page this repeat ends on: the field-list page containing it; its own page while it has no instances;
   * otherwise its last reachable page.
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
