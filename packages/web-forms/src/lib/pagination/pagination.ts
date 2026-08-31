import type {
  AnyControlNode,
  RepeatRangeUncontrolledNode,
  SelectNode,
} from '@getodk/xforms-engine';

export const isOnCurrentPage = (node: AnyControlNode | RepeatRangeUncontrolledNode): boolean => {
  if (!node.root.isPaginated) {
    return true;
  }
  const currentPage = node.root.currentState.currentPage;
  return currentPage != null && node.currentState.pageBoundary === currentPage;
};

export const advanceIfQuick = (question: SelectNode) => {
  const { appearances } = question;
  const isQuick = appearances.quick || appearances.quickcompact;
  const supportsAutoAdvance = !appearances.label && !appearances.likert;
  const isValid = question.validationState.violation == null;

  if (isQuick && supportsAutoAdvance && isValid) {
    question.root.nextPage();
  }
};
