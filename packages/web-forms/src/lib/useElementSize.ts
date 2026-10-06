import type { Ref, ShallowRef } from 'vue';
import { onMounted, onUnmounted, ref } from 'vue';

export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

const NO_SIZE: ElementSize = { width: 0, height: 0 };

const toElementSize = (entry: ResizeObserverEntry): ElementSize => {
  return { width: entry.contentRect.width, height: entry.contentRect.height };
};

const observeSize = (element: Element, size: Ref<ElementSize>): ResizeObserver => {
  const observer = new ResizeObserver(([entry]) => {
    size.value = entry == null ? NO_SIZE : toElementSize(entry);
  });
  observer.observe(element);

  return observer;
};

// The size is zero until the element is mounted and measured.
export const useElementSize = (
  element: Readonly<ShallowRef<Element | null>>
): Readonly<Ref<ElementSize>> => {
  const size = ref<ElementSize>(NO_SIZE);
  const observer = { current: null as ResizeObserver | null };

  onMounted(() => {
    observer.current = element.value == null ? null : observeSize(element.value, size);
  });
  onUnmounted(() => observer.current?.disconnect());

  return size;
};
