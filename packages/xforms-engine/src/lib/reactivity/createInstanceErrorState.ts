import { createSignal, type Accessor, type Setter } from 'solid-js';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';

export type ComputedProperty =
  | 'constraint'
  | 'count'
  | 'itemset'
  | 'label'
  | 'readonly'
  | 'relevant'
  | 'required'
  | 'value';

export interface ErrorState {
  constraint: string | null;
  count: string | null;
  itemset: string | null;
  label: string | null;
  readonly: string | null;
  relevant: string | null;
  required: string | null;
  value: string | null;
}

const EMPTY_ERROR_STATE = {
  constraint: null,
  count: null,
  itemset: null,
  label: null,
  readonly: null,
  relevant: null,
  required: null,
  value: null,
};

export const createInstanceErrorState = (
  context: EvaluationContext
): [Accessor<ErrorState>, Setter<ErrorState>] => {
  return context.scope.runTask(() => {
    return createSignal<ErrorState>(EMPTY_ERROR_STATE);
  });
};
