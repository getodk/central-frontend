export const DEFAULT_PRIMEVUE_ITEM_HEIGHT = 38;

const DEFAULT_PRIMEVUE_ITEM_GAP = 2;
const DEFAULT_PRIMEVUE_LIST_PADDING = 10;
const MAX_VISIBLE_ITEMS = 6;

export const calculateVisibleHeight = (count: number) => {
  const visibleItems = count ? Math.min(count, MAX_VISIBLE_ITEMS) : 1;
  return `${visibleItems * (DEFAULT_PRIMEVUE_ITEM_HEIGHT + DEFAULT_PRIMEVUE_ITEM_GAP) + DEFAULT_PRIMEVUE_LIST_PADDING}px`;
};
