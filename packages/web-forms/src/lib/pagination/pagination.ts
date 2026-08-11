import type {
  AnyControlNode,
  AnyParentNode,
  RepeatRangeNode,
  RepeatRangeUncontrolledNode,
  RootNode,
} from '@getodk/xforms-engine';

type ContainerNode = Exclude<AnyParentNode, RootNode>;

export const isPaginated = (root: RootNode): boolean => root.classes.pages;

export const isLeafOnCurrentPage = (leaf: AnyControlNode): boolean => {
  if (!isPaginated(leaf.root)) {
    return true;
  }
  const currentPage = leaf.root.currentState.currentPage;
  return currentPage != null && leaf.currentState.pageBoundary === currentPage;
};

export const hasVisibleBodyNodes = (node: ContainerNode): boolean => {
  if (isPaginated(node.root)) {
    return node.currentState.hasBodyNodesOnCurrentPage;
  }
  return node.currentState.hasRelevantBodyNodes;
};

export const isAddButtonVisible = (
  range: RepeatRangeNode
): range is RepeatRangeUncontrolledNode => {
  if (range.nodeType !== 'repeat-range:uncontrolled') {
    return false;
  }
  if (!isPaginated(range.root)) {
    return true;
  }
  return range.currentState.pageBoundary === range.root.currentState.currentPage;
};
