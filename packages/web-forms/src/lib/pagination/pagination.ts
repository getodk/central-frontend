import type { AnyControlNode, RepeatRangeUncontrolledNode, SelectNode } from '@getodk/xforms-engine';

export const isOnCurrentPage = (node: AnyControlNode | RepeatRangeUncontrolledNode): boolean => {
  if (!node.root.isPaginated) {
    return true;
  }
  const currentPage = node.root.currentState.currentPage;
  return currentPage != null && node.currentState.pageBoundary === currentPage;
};

export const advanceIfQuick = (question: SelectNode) => {
  const { appearances } = question;
  if ((appearances.quick || appearances.quickcompact) && !appearances.label && !appearances.likert) {
    question.root.nextPage();
  }
};
