import type { RootNode } from '@getodk/xforms-engine';
import { nextTick, watch } from 'vue';
import { containerId } from '@getodk/web-forms/lib/format/ids.ts';

type ScrollAlignment = 'center' | 'nearest';

const navigateTo = (nodeId: string, align: ScrollAlignment = 'nearest') => {
  const node = document.getElementById(nodeId);
  const container = document.getElementById(containerId(nodeId));
  // Controls without a container are their own scroll target
  const scrollTarget = container ?? node;
  if (!scrollTarget) {
    return;
  }

  scrollTarget.scrollIntoView({ behavior: 'smooth', block: align });
  const focusTarget = node ?? container;
  focusTarget?.focus({ preventScroll: true });
};

const navigateToFirstViolation = (root: RootNode | null) => {
  if (!root) {
    return;
  }

  root.navigateToFirstViolation();
  // Skips visible targets and stays silent when the target didn't change.
  void nextTick(() => {
    const target = root.currentState.navigationTarget;
    if (target) {
      navigateTo(target, 'center');
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
