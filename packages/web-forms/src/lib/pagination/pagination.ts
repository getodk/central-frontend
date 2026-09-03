import type {
  AnyControlNode,
  DescendantNodeViolationReference,
  RepeatRangeUncontrolledNode,
  RootNode,
} from '@getodk/xforms-engine';

export const isOnCurrentPage = (node: AnyControlNode | RepeatRangeUncontrolledNode): boolean => {
  if (!node.root.isPaginated) {
    return true;
  }
  const currentPage = node.root.currentState.currentPage;
  return currentPage != null && node.currentState.pageBoundary === currentPage;
};

export const getCurrentPageViolations = (root: RootNode): readonly DescendantNodeViolationReference[] => {
  if (!root.isPaginated) {
    return [];
  }

  return root.validationState.violations.filter(({ node }) => {
    // Model-only nodes have no page; they can never block navigation.
    return node.nodeType !== 'model-value' && isOnCurrentPage(node)
  });
};
