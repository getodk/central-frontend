import { batch } from 'solid-js';
import type { RepeatRangeNodeAppearances } from '../../client/repeat/BaseRepeatRangeNode.ts';
import type { RepeatRangeUncontrolledNode } from '../../client/repeat/RepeatRangeUncontrolledNode.ts';
import type { AncestorNodeValidationState } from '../../client/validation.ts';
import type { XFormsXPathNodeRange } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { createAggregatedViolations } from '../../lib/reactivity/validation/createAggregatedViolations.ts';
import type { UncontrolledRepeatDefinition } from '../../parse/model/RepeatDefinition.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import { findFirstVisibleControl } from '../navigation/findFirstVisibleControl.ts';
import { collectPages } from '../pagination/pageSequence.ts';
import type { Root } from '../Root.ts';
import { BaseRepeatRange } from './BaseRepeatRange.ts';
import { RepeatInstance } from './RepeatInstance.ts';

export class RepeatRangeUncontrolled
  extends BaseRepeatRange<UncontrolledRepeatDefinition>
  implements RepeatRangeUncontrolledNode, XFormsXPathNodeRange, EvaluationContext
{
  // RepeatRangeUncontrolledNode
  readonly nodeType = 'repeat-range:uncontrolled';
  readonly appearances: RepeatRangeNodeAppearances;
  readonly validationState: AncestorNodeValidationState;

  constructor(
    parent: GeneralParentNode,
    instanceNodes: readonly StaticElement[],
    definition: UncontrolledRepeatDefinition
  ) {
    super(parent, definition);

    this.appearances = definition.bodyElement.appearances;
    this.addChildren(definition.omitTemplate(instanceNodes));
    this.validationState = createAggregatedViolations(this, this.instanceConfig);
  }

  // RepeatRangeUncontrolledNode
  addInstances(afterIndex = this.getLastIndex(), count = 1): Root {
    const definitions = Array(count).fill(this.definition.template);

    // Batch the add with the navigation, so the reachability watcher settles once on the final state.
    batch(() => {
      const instances = this.addChildren(definitions, afterIndex);
      const firstNewInstance = instances[afterIndex + 1];
      const page = firstNewInstance == null ? null : collectPages([firstNewInstance])[0];
      if (page != null) {
        this.root.setCurrentPage(page.nodeId);
      }

      // On non-paginated forms the page move above is a no-op, but the new instance's first
      // question still becomes the navigation target.
      const target = firstNewInstance == null ? null : findFirstVisibleControl(firstNewInstance);
      if (target != null) {
        this.root.setNavigationTarget(target.nodeId);
      }
    });

    return this.root;
  }

  /**
   * Removes the {@link RepeatInstance}s corresponding to the specified range of
   * indexes, and then removes those repeat instances from the repeat range's
   * own children state in that order:
   *
   * 1. Identify the set of {@link RepeatInstance}s to be removed.
   *
   * 2. For each {@link RepeatInstance} pending removal, perform that node's
   *    removal logic. @see {@link RepeatInstance.remove} for more detail.
   *
   * 3. Finalize update to the repeat range's own {@link childrenState},
   *    omitting those {@link RepeatInstance}s which were removed.
   *
   * This ordering ensures a consistent representation of state is established
   * prior to any downstream reactive updates, and ensures that removed nodes'
   * reactivity is cleaned up.
   */
  removeInstances(startIndex: number, count = 1): Root {
    batch(() => {
      this.removeChildren(startIndex, count);
      this.navigateAfterRemoval(startIndex);
    });

    return this.root;
  }

  private navigateAfterRemoval(removedIndex: number): void {
    if (!this.root.isPaginated) {
      return;
    }

    const children = this.getChildren();
    const replacement = children[removedIndex] ?? children[removedIndex - 1];

    const page = collectPages([replacement ?? this])[0];
    if (page == null || page === this.root.getCurrentPage()) {
      return;
    }

    // Move page, otherwise initPagination's createComputed relocates the page itself and overwrites the target below
    this.root.setCurrentPage(page.nodeId);

    if (replacement == null) {
      // The Add button renders there
      this.root.setNavigationTarget(this.nodeId);
      return;
    }

    const target = findFirstVisibleControl(replacement);
    if (target != null) {
      this.root.setNavigationTarget(target.nodeId);
    }
  }
}
