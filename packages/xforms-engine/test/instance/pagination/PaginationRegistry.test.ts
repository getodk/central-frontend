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

describe('PaginationRegistry', () => {
  const buildForm = (
    instanceChildren: readonly XFormsElement[],
    bodyChildren: readonly XFormsElement[],
    binds: readonly XFormsElement[] = []
  ): XFormsElement => {
    return html(
      head(
        title('PaginationRegistry'),
        model(mainInstance(t('data id="pagination-registry"', ...instanceChildren)), ...binds)
      ),
      pagesBody(...bodyChildren)
    );
  };

  const initForm = setupPaginationForms();

  it('orders pages in document order and counts each relevant leaf toward its page', async () => {
    const root = await initForm(
      buildForm(
        [t('q1'), t('fl', t('a'), t('b'), t('c')), t('tail')],
        [
          input('/data/q1'),
          t(
            'group ref="/data/fl" appearance="field-list"',
            input('/data/fl/a'),
            input('/data/fl/b'),
            input('/data/fl/c')
          ),
          input('/data/tail'),
        ]
      )
    );

    const boundaries = root.getOrderedPages();

    expect(boundaries.length).toBe(3);
    expect(boundaries[0]?.nodeType).toBe('input');
    expect(boundaries[1]?.nodeType).toBe('group');
    expect(boundaries[2]?.nodeType).toBe('input');
    expect(root.paginationRegistry.countPageMembers(boundaries[0]!.nodeId)).toBe(1);
    expect(root.paginationRegistry.countPageMembers(boundaries[1]!.nodeId)).toBe(3);
    expect(root.paginationRegistry.countPageMembers(boundaries[2]!.nodeId)).toBe(1);
  });

  it('a field-list wrapping only a repeat counts all interior leaves on one page', async () => {
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

    const boundaries = root.getOrderedPages();

    expect(boundaries.length).toBe(2);
    expect(boundaries[0]?.nodeType).toBe('input');
    expect(boundaries[1]?.nodeType).toBe('group');
    expect(root.paginationRegistry.countPageMembers(boundaries[0]!.nodeId)).toBe(1);
    expect(root.paginationRegistry.countPageMembers(boundaries[1]!.nodeId)).toBe(2);
  });

  it('each instance page counts its subtree leaves when there is a field-list on an outer repeat', async () => {
    const root = await initForm(
      buildForm(
        [
          t(
            'hh',
            t('hhname'),
            t('member', t('mname'), t('mage')),
            t('member', t('mname'), t('mage'))
          ),
          t('hh', t('hhname'), t('member', t('mname'), t('mage'))),
        ],
        [
          group(
            '/data/hh',
            t(
              'repeat nodeset="/data/hh" appearance="field-list"',
              input('/data/hh/hhname'),
              group(
                '/data/hh/member',
                repeat(
                  '/data/hh/member',
                  input('/data/hh/member/mname'),
                  input('/data/hh/member/mage')
                )
              )
            )
          ),
        ]
      )
    );

    const boundaries = root.getOrderedPages();

    expect(boundaries.length).toBe(2);
    expect(boundaries[0]?.nodeType).toBe('repeat-instance');
    expect(boundaries[1]?.nodeType).toBe('repeat-instance');
    expect(root.paginationRegistry.countPageMembers(boundaries[0]!.nodeId)).toBe(5);
    expect(root.paginationRegistry.countPageMembers(boundaries[1]!.nodeId)).toBe(3);
  });

  it('an empty repeat counts 1 toward its field-list page until instances take over', async () => {
    const root = await initForm(
      buildForm(
        [t('outer', t('a'), t('child jr:template=""', t('q1'), t('q2')), t('b'))],
        [
          t(
            'group ref="/data/outer" appearance="field-list"',
            input('/data/outer/a'),
            group(
              '/data/outer/child',
              repeat(
                '/data/outer/child',
                input('/data/outer/child/q1'),
                input('/data/outer/child/q2')
              )
            ),
            input('/data/outer/b')
          ),
        ]
      )
    );

    const boundaries = root.getOrderedPages();

    expect(boundaries.length).toBe(1);
    expect(boundaries[0]?.nodeType).toBe('group');
    const flPageId = boundaries[0]!.nodeId;

    expect(root.paginationRegistry.countPageMembers(flPageId)).toBe(3);

    const range = getUncontrolledRange(root);

    range.addInstances();
    expect(root.getOrderedPages().length).toBe(1);
    expect(root.paginationRegistry.countPageMembers(flPageId)).toBe(4);

    range.removeInstances(0);
    expect(root.paginationRegistry.countPageMembers(flPageId)).toBe(3);
  });

  it('relevance flips on a leaf empty and restore its boundary count', async () => {
    const root = await initForm(
      buildForm(
        [t('toggle', 'yes'), t('gated')],
        [input('/data/toggle'), input('/data/gated')],
        [
          bind('/data/toggle').type('string'),
          bind('/data/gated').type('string').relevant("/data/toggle = 'yes'"),
        ]
      )
    );

    const gatedBoundary = root
      .getOrderedPages()
      .find((boundary) => boundary.currentState.reference === '/data/gated');

    expect(gatedBoundary).toBeDefined();
    expect(root.paginationRegistry.countPageMembers(gatedBoundary!.nodeId)).toBe(1);

    getInputNode(root, '/data/toggle').setValue('no');
    expect(root.paginationRegistry.countPageMembers(gatedBoundary!.nodeId)).toBe(0);

    getInputNode(root, '/data/toggle').setValue('yes');
    expect(root.paginationRegistry.countPageMembers(gatedBoundary!.nodeId)).toBe(1);
  });

  it('relevance flip on one of several leaves sharing a page decrements its count', async () => {
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

    const flBoundary = root.getOrderedPages().find((boundary) => boundary.nodeType === 'group');

    expect(flBoundary).toBeDefined();
    expect(root.paginationRegistry.countPageMembers(flBoundary!.nodeId)).toBe(2);

    getInputNode(root, '/data/toggle').setValue('no');
    expect(root.paginationRegistry.countPageMembers(flBoundary!.nodeId)).toBe(1);

    getInputNode(root, '/data/toggle').setValue('yes');
    expect(root.paginationRegistry.countPageMembers(flBoundary!.nodeId)).toBe(2);
  });

  it('exposes each leaf boundary as pageBoundary on the leaf currentState', async () => {
    const root = await initForm(
      buildForm(
        [t('fl', t('a'), t('b')), t('tail')],
        [
          t(
            'group ref="/data/fl" appearance="field-list"',
            input('/data/fl/a'),
            input('/data/fl/b')
          ),
          input('/data/tail'),
        ]
      )
    );

    const fl = getGroupNode(root, '/data/fl');
    const a = getControlNode(root, '/data/fl/a');
    const tail = getControlNode(root, '/data/tail');

    expect(a.currentState.pageBoundary).toBe(fl.nodeId);
    expect(tail.currentState.pageBoundary).toBe(tail.nodeId);
  });
});
