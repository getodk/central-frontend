import type { UncontrolledRepeatDefinition } from '../../parse/model/RepeatDefinition.ts';
import type { PageBoundary } from '../identity.ts';
import type { RootNode } from '../RootNode.ts';
import type { BlockingViolations } from '../validation.ts';
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

  /**
   * Adds instances and navigates to the first new one, unless {@link BlockingViolations} block
   * the add. Exception: a repeat inside a field-list never blocks, because adding there keeps
   * the current page.
   */
  addInstances(afterIndex?: number, count?: number): BlockingViolations;
  removeInstances(startIndex: number, count?: number): RootNode;
}
