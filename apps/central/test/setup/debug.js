import { block } from '../util/util';

const next = [];
// eslint-disable-next-line import/prefer-default-export
export const breakpoint = () => {
  const [lock, unlock] = block();
  next.push(unlock);
  return lock;
};
breakpoint.next = () => {
  if (next.length === 0) return;
  const unlock = next.shift();
  unlock();
};
