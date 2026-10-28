import {
  getRangePlaceholder,
  getRangeScale,
} from '@getodk/web-forms/components/form-elements/range/range-scale.ts';
import type { AnyRangeNode } from '@getodk/xforms-engine';
import { computed } from 'vue';

const toNumberValue = (node: AnyRangeNode): number | undefined => {
  const { value } = node.currentState;
  if (value == null) {
    return;
  }
  return Number(value);
};

export const useRangeNode = (node: AnyRangeNode) => {
  const bounds = {
    start: Number(node.definition.bounds.start),
    end: Number(node.definition.bounds.end),
    step: Number(node.definition.bounds.step),
  };
  const scale = getRangeScale({ ...bounds, tickInterval: node.nodeOptions.tickInterval });
  const placeholder = getRangePlaceholder(scale, node.nodeOptions.placeholder);
  const numberValue = computed(() => toNumberValue(node));
  const disabled = computed(() => node.currentState.readonly);
  const setValue = (value: number) => node.setValue(value);

  return { bounds, scale, placeholder, numberValue, disabled, setValue };
};
