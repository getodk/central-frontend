import {
  bind,
  group,
  head,
  html,
  input,
  mainInstance,
  model,
  repeat,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import type { XFormsElement } from '@getodk/common/test-utils/xform-dsl/XFormsElement.ts';
import { describe, expect, it } from 'vitest';
import {
  getControlNode,
  getGroupNode,
  getInputNode,
  getUncontrolledRange,
  pagesBody,
  setupPaginationForms,
} from '../../helpers/pagination.ts';

describe('DescendantNode', () => {
  const buildForm = (
    instanceChildren: readonly XFormsElement[],
    bodyChildren: readonly XFormsElement[],
    binds: readonly XFormsElement[] = []
  ): XFormsElement => {
    return html(
      head(
        title('DescendantNode'),
        model(mainInstance(t('data id="descendant-node"', ...instanceChildren)), ...binds)
      ),
      pagesBody(...bodyChildren)
    );
  };

  const initForm = setupPaginationForms();

  it('a field-list group is on-page only while currentPage points at it', async () => {
    const root = await initForm(
      buildForm(
        [t('lead'), t('fl', t('a'), t('b'))],
        [
          input('/data/lead'),
          t(
            'group ref="/data/fl" appearance="field-list"',
            input('/data/fl/a'),
            input('/data/fl/b')
          ),
        ]
      )
    );
    const fl = getGroupNode(root, '/data/fl');

    expect(fl.currentState.hasBodyNodesOnCurrentPage).toBe(false);

    root.setCurrentPage(fl.nodeId);

    expect(fl.currentState.hasBodyNodesOnCurrentPage).toBe(true);
  });

  it('a plain group is on-page only while a descendant leaf is on the current page', async () => {
    const root = await initForm(
      buildForm(
        [t('g', t('a'), t('b')), t('tail')],
        [group('/data/g', input('/data/g/a'), input('/data/g/b')), input('/data/tail')]
      )
    );
    const g = getGroupNode(root, '/data/g');
    const b = getControlNode(root, '/data/g/b');
    const tail = getControlNode(root, '/data/tail');

    expect(g.currentState.hasBodyNodesOnCurrentPage).toBe(true);

    root.setCurrentPage(b.nodeId);
    expect(g.currentState.hasBodyNodesOnCurrentPage).toBe(true);

    root.setCurrentPage(tail.nodeId);
    expect(g.currentState.hasBodyNodesOnCurrentPage).toBe(false);
  });

  it('a field-list group wrapping only a repeat is one shared page', async () => {
    const root = await initForm(
      buildForm(
        [t('intro'), t('fl', t('r', t('q')), t('r', t('q')))],
        [
          input('/data/intro'),
          t(
            'group ref="/data/fl" appearance="field-list"',
            repeat('/data/fl/r', input('/data/fl/r/q'))
          ),
        ]
      )
    );
    const fl = getGroupNode(root, '/data/fl');

    expect(fl.currentState.hasBodyNodesOnCurrentPage).toBe(false);

    root.setCurrentPage(fl.nodeId);
    expect(fl.currentState.hasBodyNodesOnCurrentPage).toBe(true);
  });

  it('a field-list whose only content is an empty repeat renders on its own page', async () => {
    const root = await initForm(
      buildForm(
        [t('lead'), t('fl', t('r jr:template=""', t('q')))],
        [
          input('/data/lead'),
          t(
            'group ref="/data/fl" appearance="field-list"',
            repeat('/data/fl/r', input('/data/fl/r/q'))
          ),
        ]
      )
    );
    const fl = getGroupNode(root, '/data/fl');

    expect(fl.currentState.hasBodyNodesOnCurrentPage).toBe(false);

    root.setCurrentPage(fl.nodeId);
    expect(fl.currentState.hasBodyNodesOnCurrentPage).toBe(true);
  });

  it('stays on-page while a relevant leaf remains after another goes irrelevant', async () => {
    const root = await initForm(
      buildForm(
        [t('toggle', 'yes'), t('fl', t('always'), t('gated'))],
        [
          input('/data/toggle'),
          t(
            'group ref="/data/fl" appearance="field-list"',
            input('/data/fl/always'),
            input('/data/fl/gated')
          ),
        ],
        [
          bind('/data/toggle').type('string'),
          bind('/data/fl/always').type('string'),
          bind('/data/fl/gated').type('string').relevant("/data/toggle = 'yes'"),
        ]
      )
    );
    const fl = getGroupNode(root, '/data/fl');

    root.setCurrentPage(fl.nodeId);
    expect(fl.currentState.hasBodyNodesOnCurrentPage).toBe(true);

    getInputNode(root, '/data/toggle').setValue('no');
    expect(fl.currentState.hasBodyNodesOnCurrentPage).toBe(true);
  });

  it('a repeat range is on-page only while an instance contains an on-page leaf', async () => {
    const root = await initForm(
      buildForm(
        [t('head'), t('r', t('q')), t('r', t('q'))],
        [input('/data/head'), repeat('/data/r', input('/data/r/q'))]
      )
    );
    const range = getUncontrolledRange(root);
    const r1q = getControlNode(root, '/data/r[1]/q');
    const r2q = getControlNode(root, '/data/r[2]/q');

    expect(range.currentState.hasBodyNodesOnCurrentPage).toBe(false);

    root.setCurrentPage(r1q.nodeId);
    expect(range.currentState.hasBodyNodesOnCurrentPage).toBe(true);

    root.setCurrentPage(r2q.nodeId);
    expect(range.currentState.hasBodyNodesOnCurrentPage).toBe(true);
  });

  it("a plain group with an empty repeat renders when the range's page is current", async () => {
    const root = await initForm(
      buildForm(
        [t('head'), t('g', t('r jr:template=""', t('q')))],
        [input('/data/head'), group('/data/g', repeat('/data/g/r', input('/data/g/r/q')))]
      )
    );
    const g = getGroupNode(root, '/data/g');

    expect(g.currentState.hasBodyNodesOnCurrentPage).toBe(false);

    root.nextPage();
    expect(g.currentState.hasBodyNodesOnCurrentPage).toBe(true);
  });
});
