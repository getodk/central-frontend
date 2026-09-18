import { createSignal } from 'solid-js';
import type { SimpleAtomicState } from './types.ts';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';

export const createInstanceErrorState = (
  context: EvaluationContext
): SimpleAtomicState<Error | null> => {
  return context.scope.runTask(() => {
    return createSignal<Error | null>(null);
  });
};
