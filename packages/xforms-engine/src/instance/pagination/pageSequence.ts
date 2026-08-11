import type { AnyChildNode, AnyControlInstanceNode, GeneralChildNode } from '../hierarchy.ts';
import type { Group } from '../Group.ts';
import type { RepeatInstance } from '../repeat/RepeatInstance.ts';
import type { RepeatRangeUncontrolled } from '../repeat/RepeatRangeUncontrolled.ts';
import { resolveFieldListPage } from './resolveFieldListPage.ts';

export const MOVE_FORWARD = 1;
export const MOVE_BACKWARD = -1;
export type NavigationDirection = typeof MOVE_BACKWARD | typeof MOVE_FORWARD;

// A page, represented by the node that defines it, and its id is the client-facing `PageBoundary`
export type Page = AnyControlInstanceNode | Group | RepeatInstance | RepeatRangeUncontrolled;
// A node that puts a page in the sequence: a control, or a repeat with no instances yet.
type PageMember = AnyControlInstanceNode | RepeatRangeUncontrolled;

const pageMembersOf = (
  children: ReadonlyArray<GeneralChildNode | RepeatInstance>
): readonly PageMember[] => {
  return children.flatMap((child): readonly PageMember[] => {
    if (child.nodeType === 'model-value') {
      return [];
    }

    if (child.nodeType === 'repeat-range:uncontrolled') {
      const instances = child.getChildren();
      return instances.length === 0 ? [child] : pageMembersOf(instances);
    }

    if (
      child.nodeType === 'group' ||
      child.nodeType === 'repeat-instance' ||
      child.nodeType === 'repeat-range:controlled'
    ) {
      return pageMembersOf(child.getChildren());
    }

    return [child];
  });
};

const pageOf = (member: PageMember): Page => {
  return resolveFieldListPage(member) ?? member;
};

/**
 * Returns every page in the order it appears in the form, each appearing once at its first member.
 * An empty repeat counts as a page, so its "add" button can be reached.
 */
export const collectPages = (
  children: ReadonlyArray<GeneralChildNode | RepeatInstance>
): readonly Page[] => {
  const pages = pageMembersOf(children).map(pageOf);

  return pages.filter((page, index) => {
    return pages.findIndex((candidate) => candidate.nodeId === page.nodeId) === index;
  });
};

export const scanForReachable = (
  pages: readonly Page[],
  start: number,
  step: NavigationDirection,
  isReachable: (page: Page) => boolean
): Page | null => {
  if (start < 0) {
    return null;
  }
  const ordered = step === MOVE_FORWARD ? pages.slice(start) : pages.slice(0, start + 1).reverse();
  return ordered.find(isReachable) ?? null;
};

/**
 * Finds somewhere to go when the current page no longer exists (its repeat instance was removed).
 *
 * Searches forward from the first page of the node's nearest remaining ancestor, so a removed instance lands on one
 * of its repeat's remaining instances rather than jumping back over the whole repeat.
 */
export const nearestReachablePage = (
  rootChildren: readonly GeneralChildNode[],
  node: Page,
  isReachable: (page: Page) => boolean
): Page | null => {
  const pages = collectPages(rootChildren);
  const origin = findNearestRemainingAncestor(rootChildren, node);
  const originFirstPage = origin == null ? null : (collectPages([origin])[0] ?? null);
  const originIndex = pages.findIndex((page) => page.nodeId === originFirstPage?.nodeId);
  const start = Math.max(0, originIndex);

  return (
    scanForReachable(pages, start, MOVE_FORWARD, isReachable) ??
    scanForReachable(pages, start - 1, MOVE_BACKWARD, isReachable)
  );
};

// Only runs when the current page has been removed. Whether a node is still in the form can't be judged from its links
// (a removed instance's descendants still reference each other), so the chain must be re-verified from the root down.
const findNearestRemainingAncestor = (
  rootChildren: readonly GeneralChildNode[],
  node: Page
): GeneralChildNode | RepeatInstance | null => {
  const chain: AnyChildNode[] = [];
  let current: AnyChildNode = node;
  while (current.parent.nodeType !== 'root') {
    chain.push(current);
    current = current.parent;
  }
  chain.push(current);

  let deepestRemaining: GeneralChildNode | RepeatInstance | null = null;
  let liveChildren: ReadonlyArray<GeneralChildNode | RepeatInstance> = rootChildren;
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const candidate = chain[i]!;
    const remaining = liveChildren.find((child) => child.nodeId === candidate.nodeId);
    if (remaining == null) {
      break;
    }
    deepestRemaining = remaining;
    liveChildren = remaining.getChildren() ?? [];
  }

  return deepestRemaining;
};
