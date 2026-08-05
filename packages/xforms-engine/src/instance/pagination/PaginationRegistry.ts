import type { Accessor } from 'solid-js';
import { createComputed, createSignal, onCleanup } from 'solid-js';
import type { FormNodeID, PageBoundary } from '../../client/identity.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import { resolveFieldListPage } from './resolveFieldListPage.ts';

// A control or repeat range that belongs to a page. `attachLeaf` runs inside the node's own
// constructor, so anything added here must already be assigned by that point.
export interface PaginationMember {
  readonly nodeId: FormNodeID;
  readonly parent: GeneralParentNode;
  readonly isRelevant: Accessor<boolean>;
  readonly scope: ReactiveScope;
}

export interface PaginationRange extends PaginationMember {
  // Page counts are recomputed when instances are added or removed.
  getChildren(): readonly unknown[];
}

interface RelevantLeafCount {
  readonly getCount: Accessor<number>;
  readonly setCount: (update: (count: number) => number) => void;
  // Counts registered leaves so this entry can be dropped when the last one goes, keeping the map
  // from growing as repeat instances come and go.
  attachedLeaves: number;
}

/**
 * Counts how many controls on each page are currently relevant, which is how `Root` decides which pages can be
 * navigated to. The order of pages is not kept here; `Root` works that out from the form itself.
 *
 * Each node registers itself and cleans up when it is removed, so the registry never has to be told about removals.
 * Only ids are stored, never nodes, so removed instances can be garbage collected.
 */
export class PaginationRegistry {
  private readonly pageLeafCounts = new Map<FormNodeID, RelevantLeafCount>();
  private readonly leafPages = new Map<FormNodeID, FormNodeID>();
  private readonly rangePages = new Map<FormNodeID, FormNodeID>();
  private readonly pageRanges = new Map<FormNodeID, Set<PaginationRange>>();

  constructor(readonly enabled: boolean) {}

  getLeafPageId(leafId: FormNodeID): FormNodeID | null {
    return this.leafPages.get(leafId) ?? null;
  }

  // Returns `null` when the range is controlled, or the form has no pages.
  getRangePageId(rangeId: FormNodeID): FormNodeID | null {
    return this.rangePages.get(rangeId) ?? null;
  }

  /**
   * Count the things that keep this page reachable: its relevant controls, plus any empty repeat whose
   * "add" button sits on it. Zero means the page has nothing to show.
   *
   * A page that has no controls yet relies on the range check below to notice its first one.
   */
  countPageMembers(pageId: FormNodeID): number {
    const leafCount = this.pageLeafCounts.get(pageId)?.getCount() ?? 0;
    const ranges = this.pageRanges.get(pageId);
    if (ranges == null) {
      return leafCount;
    }

    const contributing = Array.from(ranges).filter((range) => {
      return range.getChildren().length === 0 && range.isRelevant();
    });
    return leafCount + contributing.length;
  }

  /**
   * Works out which page a node belongs to and hands it to the "record" callback, which performs whatever bookkeeping
   * that kind of node needs. A form without pages skips all of it.
   */
  private attach(node: PaginationMember, record: (pageId: PageBoundary) => void): PageBoundary {
    if (!this.enabled) {
      return node.nodeId;
    }

    const pageId = resolveFieldListPage(node)?.nodeId ?? node.nodeId;
    record(pageId);
    return pageId;
  }

  // Called from every control's constructor.
  attachLeaf(leaf: PaginationMember): PageBoundary {
    return this.attach(leaf, (pageId) => {
      this.leafPages.set(leaf.nodeId, pageId);
      this.registerLeaf(leaf, pageId);
    });
  }

  /**
   * Called from every repeat range's constructor.
   *
   * An uncontrolled range keeps its page reachable while it is empty and relevant, so its "add" button can still be
   * navigated to. Controlled ranges have no "add" button and never contribute a page.
   */
  attachRange(range: PaginationRange, isUncontrolled: boolean): PageBoundary {
    return this.attach(range, (pageId) => {
      if (!isUncontrolled) {
        return;
      }
      this.rangePages.set(range.nodeId, pageId);
      this.registerRange(range, pageId);
    });
  }

  /**
   * Unlike {@link registerLeaf}, this keeps no count of its own ({@link countPageMembers} checks the range directly
   * each time). That avoids depending on the order updates happen in.
   */
  private registerRange(range: PaginationRange, pageId: FormNodeID): void {
    const ranges = this.pageRanges.get(pageId) ?? new Set<PaginationRange>();
    ranges.add(range);
    this.pageRanges.set(pageId, ranges);

    range.scope.runTask(() => {
      onCleanup(() => {
        this.rangePages.delete(range.nodeId);
        ranges.delete(range);
        if (ranges.size === 0) {
          this.pageRanges.delete(pageId);
        }
      });
    });
  }

  /**
   * Adds the control to its page's count, and keeps that count in step as its relevance changes. Everything here is
   * undone automatically when the control is removed.
   */
  private registerLeaf(leaf: PaginationMember, pageId: FormNodeID): void {
    const leafCount = this.resolveLeafCount(pageId);
    leafCount.attachedLeaves += 1;

    leaf.scope.runTask(() => {
      createComputed(() => {
        if (!leaf.isRelevant()) {
          return;
        }
        // Update without reading `count`, which would re-trigger this computed.
        leafCount.setCount((count) => count + 1);

        // Undone before the next check, and when the control is removed.
        onCleanup(() => {
          leafCount.setCount((count) => count - 1);
        });
      });

      onCleanup(() => {
        this.leafPages.delete(leaf.nodeId);
        leafCount.attachedLeaves -= 1;
        if (leafCount.attachedLeaves === 0) {
          this.pageLeafCounts.delete(pageId);
        }
      });
    });
  }

  private resolveLeafCount(pageId: FormNodeID): RelevantLeafCount {
    const existing = this.pageLeafCounts.get(pageId);
    if (existing != null) {
      return existing;
    }

    const [getCount, setCount] = createSignal(0);
    const leafCount: RelevantLeafCount = { getCount, setCount, attachedLeaves: 0 };
    this.pageLeafCounts.set(pageId, leafCount);
    return leafCount;
  }
}
