import { watchSync } from '../util/reactivity';

export const useRowChanged = (tr) => {
  watchSync(tr, () => {
    if (tr.value != null)
      // eslint-disable-next-line no-param-reassign
      tr.value.dataset.useRowChanged = 'false';
  });
};

export const rowsChanged = (trs) => {
  for (const tr of trs) tr.dataset.useRowChanged = 'true';
  setTimeout(() => {
    for (const tr of trs) tr.dataset.useRowChanged = 'false';
  });
};

export const rowChanged = (tr) => { rowsChanged([tr]); };
