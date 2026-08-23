import type { RootNode } from '@getodk/xforms-engine';
import { nextTick, watch } from 'vue';
import { containerId } from '@/lib/format/ids.ts';

const findContainer = (nodeId: string): HTMLElement | null => {
  return document.getElementById(containerId(nodeId));
};

const scrollToContainer = (container: HTMLElement) => {
  if (container.offsetTop < window.innerHeight) {
    document.scrollingElement?.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const navigateTo = (nodeId: string) => {
  const container = findContainer(nodeId);
  if (container == null) {
    return;
  }
  scrollToContainer(container);
  container.focus({ preventScroll: true });
};

const applyCurrentTarget = (root: RootNode) => {
  const target = root.currentState.navigationTarget;
  if (target) {
    navigateTo(target);
  }
};

const navigateToFirstViolation = (root: RootNode | null) => {
  if (!root) {
    return;
  }
  root.navigateToFirstViolation();
  void nextTick(() => applyCurrentTarget(root));
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
    navigateToFirstViolation: () => navigateToFirstViolation(getRoot())
  };
};
