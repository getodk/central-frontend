import type { BlockingViolations } from '@getodk/xforms-engine';
import { inject } from 'vue';
import { REVEAL_VIOLATIONS } from '@getodk/web-forms/lib/constants/injection-keys.ts';

export type RevealViolations = (violations: BlockingViolations) => void;

export const useRevealViolations = (): RevealViolations => {
  const revealNothing = () => undefined;
  return inject(REVEAL_VIOLATIONS, revealNothing);
};
