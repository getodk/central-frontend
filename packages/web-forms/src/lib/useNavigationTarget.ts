import type { RootNode } from '@getodk/xforms-engine';
import { nextTick, watch } from 'vue';
import { containerId } from '@/lib/format/ids.ts';

const findContainer = (nodeId: string): HTMLElement | null => {
  return document.getElementById(containerId(nodeId));
};

const scrollToContainer = (container: HTMLElement) => {
  const documentTop = container.getBoundingClientRect().top + window.scrollY;
  if (documentTop < window.innerHeight) {
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
  const targetBeforeNavigation = root.currentState.navigationTarget;
  root.navigateToFirstViolation();
  // The engine updates navigationTarget; if the value didn't change, the watcher won't fire, so trigger the scroll and focus here
  if (root.currentState.navigationTarget === targetBeforeNavigation) {
    void nextTick(() => applyCurrentTarget(root));
  }
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
