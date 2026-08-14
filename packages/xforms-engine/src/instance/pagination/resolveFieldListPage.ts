import type { Group } from '../Group.ts';
import type { GeneralParentNode, RepeatRange } from '../hierarchy.ts';
import type { RepeatInstance } from '../repeat/RepeatInstance.ts';

type AncestorNode = GeneralParentNode | RepeatRange;
type FieldListNode = Group | RepeatInstance;

/**
 * A `field-list` group, or a repeat instance whose `<repeat>` carries `field-list`; that appearance paginates
 * the repeat's instances, so a range is never a field-list node itself.
 */
const isFieldListNode = (node: AncestorNode): node is FieldListNode => {
  return (
    (node.nodeType === 'group' || node.nodeType === 'repeat-instance') &&
    node.appearances?.['field-list'] === true
  );
};

/**
 * Each field-list found replaces the previous one, so the last seen is the outermost.
 */
const resolveOutermostFieldList = (
  node: AncestorNode,
  found: FieldListNode | null
): FieldListNode | null => {
  if (node.nodeType === 'root') {
    return found;
  }

  const outermost = isFieldListNode(node) ? node : found;
  return resolveOutermostFieldList(node.parent, outermost);
};

/**
 * Finds the field-list container that a control, or an empty repeat, shares a page with.
 * Returns `null` when nothing encloses it, meaning it is a page on its own.
 *
 * When field-lists nest, the outermost one wins. A field-list also holds on through any repeat inside it:
 * every control of every instance lands on the field-list's own page.
 */
export const resolveFieldListPage = (member: {
  readonly parent: GeneralParentNode;
}): FieldListNode | null => {
  return resolveOutermostFieldList(member.parent, null);
};
