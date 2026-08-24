import type { RootNode } from '@getodk/xforms-engine';
import { nextTick, watch } from 'vue';
import { containerId } from '@getodk/web-forms/lib/format/ids.ts';

type ScrollAlignment = 'center' | 'start';

const scrollToContainer = (container: HTMLElement, align: ScrollAlignment) => {
  const rect = container.getBoundingClientRect();
  const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
  const isMostlyVisible = visibleHeight >= rect.height * 0.5;

  if (align === 'start' && isMostlyVisible) {
    return;
  }

  container.scrollIntoView({ behavior: 'smooth', block: align });
};

const navigateTo = (nodeId: string, align: ScrollAlignment = 'start') => {
  // Controls without a container are their own scroll target
  const container = document.getElementById(containerId(nodeId)) ?? document.getElementById(nodeId);

  if (!container) {
    return;
  }

  scrollToContainer(container, align);
  const focusTarget = document.getElementById(nodeId) ?? container;
  focusTarget.focus({ preventScroll: true });
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
