import type { AnyControlNode, RepeatRangeUncontrolledNode } from '@getodk/xforms-engine';

export const isOnCurrentPage = (node: AnyControlNode | RepeatRangeUncontrolledNode): boolean => {
  if (!node.root.isPaginated) {
    return true;
  }
  const currentPage = node.root.currentState.currentPage;
  return currentPage != null && node.currentState.pageBoundary === currentPage;
};
