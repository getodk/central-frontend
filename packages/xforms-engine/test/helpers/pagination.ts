import { BodyXFormsElement } from '@getodk/common/test-utils/xform-dsl/BodyXFormsElement.ts';
import { TagXFormsElement } from '@getodk/common/test-utils/xform-dsl/TagXFormsElement.ts';
import type { XFormsElement } from '@getodk/common/test-utils/xform-dsl/XFormsElement.ts';
import { createRoot } from 'solid-js';
import { createMutable } from 'solid-js/store';
import { afterEach } from 'vitest';
import { createInstance } from '../../src/entrypoints/createInstance.ts';
import type { Group } from '../../src/instance/Group.ts';
import type { AnyInputControl } from '../../src/instance/InputControl.ts';
import { Root } from '../../src/instance/Root.ts';
import type { AnyControlInstanceNode, AnyNode } from '../../src/instance/hierarchy.ts';
import type { RepeatInstance } from '../../src/instance/repeat/RepeatInstance.ts';
import type { RepeatRangeUncontrolled } from '../../src/instance/repeat/RepeatRangeUncontrolled.ts';

class PagesBodyXFormsElement extends TagXFormsElement implements BodyXFormsElement {
  override readonly name = 'h:body';

  constructor(children: readonly XFormsElement[]) {
    super('h:body', new Map([['class', 'pages']]), children);
  }
}

export const pagesBody = (...children: XFormsElement[]): BodyXFormsElement => {
  return new PagesBodyXFormsElement(children);
};

interface PaginationTestForm {
  readonly dispose: VoidFunction;
  readonly root: Root;
}

const initializePaginationTestForm = async (form: XFormsElement): Promise<PaginationTestForm> => {
  return createRoot(async (dispose) => {
    const { root } = await createInstance(form.asXml(), {
      instance: {
        stateFactory: createMutable,
      },
    });

    if (!(root instanceof Root)) {
      throw new Error('Expected createInstance to produce the internal Root implementation');
    }

    return { dispose, root };
  });
};

export const setupPaginationForms = (): ((form: XFormsElement) => Promise<Root>) => {
  const initialized: PaginationTestForm[] = [];

  afterEach(() => {
    initialized.splice(0).forEach(({ dispose }) => {
      dispose();
    });
  });

  return async (form) => {
    const testForm = await initializePaginationTestForm(form);
    initialized.push(testForm);
    return testForm.root;
  };
};

const getNodeByReference = (root: Root, reference: string): AnyNode => {
  const node = root.evaluator.evaluateNode<AnyNode>(reference);
  if (node == null) {
    throw new Error(`No node for reference: ${reference}`);
  }
  return node;
};

const CONTROL_NODE_TYPES: ReadonlySet<AnyNode['nodeType']> = new Set([
  'input',
  'note',
  'range',
  'rank',
  'select',
  'trigger',
  'upload',
]);

const isControlNode = (node: AnyNode): node is AnyControlInstanceNode => {
  return CONTROL_NODE_TYPES.has(node.nodeType);
};

export const getControlNode = (root: Root, reference: string): AnyControlInstanceNode => {
  const node = getNodeByReference(root, reference);
  if (!isControlNode(node)) {
    throw new Error(`Node at ${reference} is a ${node.nodeType}, not a control`);
  }
  return node;
};

export const getInputNode = (root: Root, reference: string): AnyInputControl => {
  const node = getNodeByReference(root, reference);
  if (node.nodeType !== 'input') {
    throw new Error(`Node at ${reference} is a ${node.nodeType}, not an input`);
  }
  return node;
};

export const getGroupNode = (root: Root, reference: string): Group => {
  const node = getNodeByReference(root, reference);
  if (node.nodeType !== 'group') {
    throw new Error(`Node at ${reference} is a ${node.nodeType}, not a group`);
  }
  return node;
};

export const getRepeatInstanceNode = (root: Root, reference: string): RepeatInstance => {
  const node = getNodeByReference(root, reference);
  if (node.nodeType !== 'repeat-instance') {
    throw new Error(`Node at ${reference} is a ${node.nodeType}, not a repeat instance`);
  }
  return node;
};

const findUncontrolledRange = (node: AnyNode): RepeatRangeUncontrolled | null => {
  if (node.nodeType === 'repeat-range:uncontrolled') {
    return node;
  }

  return (
    node
      .getChildren()
      .map(findUncontrolledRange)
      .find((found) => found != null) ?? null
  );
};

export const getUncontrolledRange = (node: AnyNode): RepeatRangeUncontrolled => {
  const range = findUncontrolledRange(node);
  if (range == null) {
    throw new Error('No uncontrolled repeat range found in subtree');
  }
  return range;
};
