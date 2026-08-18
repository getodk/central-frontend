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
  getRepeatInstanceNode,
  getUncontrolledRange,
  pagesBody,
  setupPaginationForms,
} from '../../helpers/pagination.ts';

describe('Pagination', () => {
  const buildForm = (
    instanceChildren: readonly XFormsElement[],
    bodyChildren: readonly XFormsElement[],
    binds: readonly XFormsElement[] = []
  ): XFormsElement => {
    return html(
      head(
        title('Pagination'),
        model(mainInstance(t('data id="pagination"', ...instanceChildren)), ...binds)
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
    expect(root.pagination.countPageMembers(boundaries[0]!.nodeId)).toBe(1);
    expect(root.pagination.countPageMembers(boundaries[1]!.nodeId)).toBe(3);
    expect(root.pagination.countPageMembers(boundaries[2]!.nodeId)).toBe(1);
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
    expect(root.pagination.countPageMembers(boundaries[0]!.nodeId)).toBe(1);
    expect(root.pagination.countPageMembers(boundaries[1]!.nodeId)).toBe(2);
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
    expect(root.pagination.countPageMembers(boundaries[0]!.nodeId)).toBe(5);
    expect(root.pagination.countPageMembers(boundaries[1]!.nodeId)).toBe(3);
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

    expect(root.pagination.countPageMembers(flPageId)).toBe(3);

    const range = getUncontrolledRange(root);

    range.addInstances();
    expect(root.getOrderedPages().length).toBe(1);
    expect(root.pagination.countPageMembers(flPageId)).toBe(4);

    range.removeInstances(0);
    expect(root.pagination.countPageMembers(flPageId)).toBe(3);
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
    expect(root.pagination.countPageMembers(gatedBoundary!.nodeId)).toBe(1);

    getInputNode(root, '/data/toggle').setValue('no');
    expect(root.pagination.countPageMembers(gatedBoundary!.nodeId)).toBe(0);

    getInputNode(root, '/data/toggle').setValue('yes');
    expect(root.pagination.countPageMembers(gatedBoundary!.nodeId)).toBe(1);
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
    expect(root.pagination.countPageMembers(flBoundary!.nodeId)).toBe(2);

    getInputNode(root, '/data/toggle').setValue('no');
    expect(root.pagination.countPageMembers(flBoundary!.nodeId)).toBe(1);

    getInputNode(root, '/data/toggle').setValue('yes');
    expect(root.pagination.countPageMembers(flBoundary!.nodeId)).toBe(2);
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

  it('a repeat outside a field-list is its own pageBoundary while empty, then the page of its last relevant question', async () => {
    const root = await initForm(
      buildForm(
        [t('toggle', 'yes'), t('child jr:template=""', t('q1'), t('q2'))],
        [
          input('/data/toggle'),
          group(
            '/data/child',
            repeat('/data/child', input('/data/child/q1'), input('/data/child/q2'))
          ),
        ],
        [
          bind('/data/toggle').type('string'),
          bind('/data/child/q2').type('string').relevant("/data/toggle = 'yes'"),
        ]
      )
    );

    const range = getUncontrolledRange(root);
    expect(range.currentState.pageBoundary).toBe(range.nodeId);

    range.addInstances();
    expect(range.currentState.pageBoundary).toBe(getControlNode(root, '/data/child[1]/q2').nodeId);

    range.addInstances();
    expect(range.currentState.pageBoundary).toBe(getControlNode(root, '/data/child[2]/q2').nodeId);

    getInputNode(root, '/data/toggle').setValue('no');
    expect(range.currentState.pageBoundary).toBe(getControlNode(root, '/data/child[2]/q1').nodeId);

    getInputNode(root, '/data/toggle').setValue('yes');
    expect(range.currentState.pageBoundary).toBe(getControlNode(root, '/data/child[2]/q2').nodeId);
  });

  it('an empty inner repeat is the page where its outer repeat ends', async () => {
    const root = await initForm(
      buildForm(
        [t('hh jr:template=""', t('hhname'), t('member jr:template=""', t('mname')))],
        [
          group(
            '/data/hh',
            repeat(
              '/data/hh',
              input('/data/hh/hhname'),
              group('/data/hh/member', repeat('/data/hh/member', input('/data/hh/member/mname')))
            )
          ),
        ]
      )
    );

    const outer = getUncontrolledRange(root);
    outer.addInstances();

    const inner = getUncontrolledRange(getRepeatInstanceNode(root, '/data/hh[1]'));
    expect(inner.getChildren().length).toBe(0);
    expect(outer.currentState.pageBoundary).toBe(inner.nodeId);

    inner.addInstances();
    const member = getControlNode(root, '/data/hh[1]/member[1]/mname');
    expect(inner.currentState.pageBoundary).toBe(member.nodeId);
    expect(outer.currentState.pageBoundary).toBe(member.nodeId);
  });
});
