import type { RootNode } from '@getodk/xforms-engine';
import { nextTick, watch } from 'vue';
import { containerId } from '@getodk/web-forms/lib/format/ids.ts';

const isDatepickerInput = (el: HTMLElement | null) => !!el?.matches('.p-datepicker-input');
const hasErrorHighlight = (el: HTMLElement | null) => el?.closest('.highlight') != null;

const findControl = (
  node: HTMLElement | null,
  container: HTMLElement | null
): HTMLElement | null => {
  const FOCUSABLE = ':is(button, input, textarea, [tabindex]:not([tabindex="-1"])):not(:disabled)';
  if (node?.matches(FOCUSABLE)) {
    return node;
  }

  // Some controls (radios, upload) don't carry the question id on their focusable element, so search for it.
  return (container ?? node)?.querySelector<HTMLElement>(FOCUSABLE) ?? null;
};

// Exported for tests
export const findFocusTarget = (
  node: HTMLElement | null,
  container: HTMLElement | null
): HTMLElement | null => {
  const control = findControl(node, container);
  // Focusing a datepicker opens the calendar; when the question has no validation error, focus the container instead.
  if (isDatepickerInput(control) && !hasErrorHighlight(control)) {
    return container;
  }
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

const navigateToFirstViolation = (root?: RootNode | null) => {
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

const navigateToNode = (nodeId?: string | null) => {
  if (!nodeId) {
    return;
  }
  // Wait for the render cycle to settle
  // focusing a still mounting question breaks popups like the datepicker.
  void nextTick(() => navigateTo(nodeId));
};

export const useNavigationTarget = (getRoot: () => RootNode | null | undefined) => {
  watch(
    () => getRoot()?.currentState.navigationTarget,
    (nodeId) => navigateToNode(nodeId),
    { flush: 'post' }
  );

  return {
    navigateToFirstViolation: () => navigateToFirstViolation(getRoot()),
    navigateToNode: (nodeId?: string | null) => navigateToNode(nodeId),
  };
};
