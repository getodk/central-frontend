import { watch } from 'vue';
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

export const useNavigationTarget = (target: () => string | null) => {
  watch(
    target,
    (nodeId) => {
      if (nodeId != null) {
        navigateTo(nodeId);
      }
    },
    { flush: 'post' }
  );
};
