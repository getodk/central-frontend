import type { Accessor } from 'solid-js';
import { createSignal } from 'solid-js';
import type { FormNodeID } from '../../client/identity.ts';

export interface NodeNavigation {
  readonly navigationTarget: Accessor<FormNodeID | null>;
  setNavigationTarget(target: FormNodeID | null): void;
}

export const createNodeNavigation = (): NodeNavigation => {
  const [navigationTarget, setNavigationTarget] = createSignal<FormNodeID | null>(null);

  return { navigationTarget, setNavigationTarget };
};
