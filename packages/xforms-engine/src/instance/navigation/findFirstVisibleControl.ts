import { untrack } from 'solid-js';
import { ValueNode } from '../abstract/ValueNode.ts';
import type { AnyControlInstanceNode, GeneralChildNode } from '../hierarchy.ts';
import type { RepeatInstance } from '../repeat/RepeatInstance.ts';
import type { Root } from '../Root.ts';
import { UploadControl } from '../UploadControl.ts';

export type NavigationScope = GeneralChildNode | RepeatInstance | Root;

const searchSubtree = (node: NavigationScope): AnyControlInstanceNode | null => {
  if (node.nodeType === 'model-value' || !node.isSelfRelevant()) {
    return null;
  }

  // UploadControl is the one control whose value (an attachment) keeps it off the ValueNode base.
  if (node instanceof ValueNode || node instanceof UploadControl) {
    return node;
  }

  for (const child of node.getChildren()) {
    const found = searchSubtree(child);
    if (found != null) {
      return found;
    }
  }

  return null;
};

export const findFirstVisibleControl = (scope: NavigationScope): AnyControlInstanceNode | null => {
  // Untracked so a caller inside a computed never subscribes to the walked nodes.
  return untrack(() => (scope.hasNonRelevantAncestor() ? null : searchSubtree(scope)));
};
