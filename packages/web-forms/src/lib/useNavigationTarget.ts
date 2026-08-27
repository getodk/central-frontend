import type { RootNode } from '@getodk/xforms-engine';
import { nextTick, watch } from 'vue';
import { containerId } from '@getodk/web-forms/lib/format/ids.ts';

const findFocusTarget = (
  node: HTMLElement | null,
  container: HTMLElement | null
): HTMLElement | null => {
  // Focusing a datepicker input opens its calendar inline instead of a popup.
  const FOCUSABLE =
    ':is(button, input, textarea, [tabindex]:not([tabindex="-1"])):not(:disabled):not(.p-datepicker-input)';
  if (node?.matches(FOCUSABLE)) {
    return node;
  }

  // Some controls (radios, upload) don't carry the question id on their focusable element, so search for it.
  const control = (container ?? node)?.querySelector<HTMLElement>(FOCUSABLE);
  return control ?? container ?? node;
};

const navigateTo = (nodeId: string) => {
  const node = document.getElementById(nodeId);
  const container = document.getElementById(containerId(nodeId));

  // Controls without a container are their own scroll target
  const scrollTarget = container ?? node;
  if (!scrollTarget) {
    return;
  }
  scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const focusTarget = findFocusTarget(node, container);
  // focusVisible is supported in modern Chrome, Firefox and Safari
  // @ts-expect-error -- focusVisible is missing from FocusOptions
  focusTarget?.focus({ preventScroll: true, focusVisible: true });
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
