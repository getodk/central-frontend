import type { Group } from '../Group.ts';
import type { GeneralParentNode, RepeatRange } from '../hierarchy.ts';
import type { RepeatInstance } from '../repeat/RepeatInstance.ts';

type AncestorNode = GeneralParentNode | RepeatRange;
type FieldListAnchor = Group | RepeatInstance;

/**
 * A `field-list` group, or a repeat instance whose `<repeat>` carries `field-list`; that appearance paginates
 * the repeat's instances, so a range is never an anchor itself.
 */
const isFieldListAnchor = (node: AncestorNode): node is FieldListAnchor => {
  return (
    (node.nodeType === 'group' || node.nodeType === 'repeat-instance') &&
    node.appearances?.['field-list'] === true
  );
};

/**
 * Each anchor found replaces the previous one, so the last seen is the outermost.
 */
const resolveOutermostAnchor = (node: AncestorNode, found: FieldListAnchor | null): FieldListAnchor | null => {
  if (node.nodeType === 'root') {
    return found;
  }

  const outermost = isFieldListAnchor(node) ? node : found;
  return resolveOutermostAnchor(node.parent, outermost);
};

/**
 * Finds the field-list container that a control, or an empty repeat, shares a page with.
 * Returns `null` when nothing encloses it, meaning it is a page on its own.
 *
 * When field-lists nest, the outermost one wins. A field-list also holds on through any repeat inside it:
 * every control of every instance lands on the field-list's own page.
 */
export const resolveFieldListPage = (member: { readonly parent: GeneralParentNode; }): FieldListAnchor | null => {
  return resolveOutermostAnchor(member.parent, null);
};
