import type { RootNode } from '@getodk/xforms-engine';
import { nextTick, watch } from 'vue';
import { containerId } from '@getodk/web-forms/lib/format/ids.ts';

const navigateTo = (nodeId: string) => {
  const node = document.getElementById(nodeId);
  const container = document.getElementById(containerId(nodeId));
  // Controls without a container are their own scroll target
  const scrollTarget = container ?? node;
  if (!scrollTarget) {
    return;
  }

  scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  const focusTarget = node ?? container;
  focusTarget?.focus({ preventScroll: true });
};

const navigateToFirstViolation = (root: RootNode | null) => {
  if (!root) {
    return;
  }

  const previousTarget = root.currentState.navigationTarget;
  root.navigateToFirstViolation();
  // The navigationTarget watch ignores unchanged ids, so navigate explicitly.
  void nextTick(() => {
    const target = root.currentState.navigationTarget;
    if (target && target === previousTarget) {
      navigateTo(target);
    }
  });
};

export const useNavigationTarget = (getRoot: () => RootNode | null) => {
  watch(
    () => getRoot()?.currentState.navigationTarget,
    (nodeId) => {
      if (nodeId) {
        navigateTo(nodeId);
      }
    },
    { flush: 'post' }
  );

  return {
    navigateToFirstViolation: () => navigateToFirstViolation(getRoot()),
  };
};
