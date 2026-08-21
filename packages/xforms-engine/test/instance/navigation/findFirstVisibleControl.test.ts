import {
  bind,
  body,
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
import { findFirstVisibleControl } from '../../../src/instance/navigation/findFirstVisibleControl.ts';
import {
  getControlNode,
  getGroupNode,
  getInputNode,
  getRepeatInstanceNode,
  getUncontrolledRange,
  setupPaginationForms,
} from '../../helpers/pagination.ts';

describe('findFirstVisibleControl', () => {
  const initForm = setupPaginationForms();

  const buildForm = (
    instanceChildren: readonly XFormsElement[],
    bodyChildren: readonly XFormsElement[],
    binds: readonly XFormsElement[] = []
  ): XFormsElement => {
    return html(
      head(
        title('findFirstVisibleControl'),
        model(
          mainInstance(t('data id="find-first-visible-control"', ...instanceChildren)),
          ...binds
        )
      ),
      body(...bodyChildren)
    );
  };

  it('returns the first question in document order', async () => {
    const root = await initForm(
      buildForm([t('q1'), t('q2')], [input('/data/q1'), input('/data/q2')])
    );

    expect(findFirstVisibleControl(root)).toBe(getControlNode(root, '/data/q1'));
  });

  it('skips a non-relevant question and resolves again when relevance changes', async () => {
    const root = await initForm(
      buildForm(
        [t('toggle', 'no'), t('g', t('q1'), t('q2'))],
        [input('/data/toggle'), group('/data/g', input('/data/g/q1'), input('/data/g/q2'))],
        [
          bind('/data/toggle').type('string'),
          bind('/data/g/q1').type('string').relevant("/data/toggle = 'yes'"),
        ]
      )
    );

    const groupRef = getGroupNode(root, '/data/g');

    expect(findFirstVisibleControl(groupRef)).toBe(getControlNode(root, '/data/g/q2'));

    getInputNode(root, '/data/toggle').setValue('yes');
    expect(findFirstVisibleControl(groupRef)).toBe(getControlNode(root, '/data/g/q1'));
  });

  it('skips a whole non-relevant group even when its own questions have no relevant expression', async () => {
    const root = await initForm(
      buildForm(
        [t('g', t('q1'), t('q2')), t('q3'), t('toggle', 'no')],
        [
          group('/data/g', input('/data/g/q1'), input('/data/g/q2')),
          input('/data/q3'),
          input('/data/toggle'),
        ],
        [bind('/data/toggle').type('string'), bind('/data/g').relevant("/data/toggle = 'yes'")]
      )
    );

    expect(findFirstVisibleControl(root)).toBe(getControlNode(root, '/data/q3'));

    getInputNode(root, '/data/toggle').setValue('yes');
    expect(findFirstVisibleControl(root)).toBe(getControlNode(root, '/data/g/q1'));
  });

  it('resolves within a repeat instance scope', async () => {
    const root = await initForm(
      buildForm(
        [t('r', t('q1'), t('q2')), t('r', t('q1'), t('q2'))],
        [repeat('/data/r', input('/data/r/q1'), input('/data/r/q2'))]
      )
    );

    const secondInstance = getRepeatInstanceNode(root, '/data/r[2]');
    expect(findFirstVisibleControl(secondInstance)).toBe(getControlNode(root, '/data/r[2]/q1'));
  });

  it('returns null for an empty repeat range scope', async () => {
    const root = await initForm(
      buildForm([t('r', t('q1'))], [repeat('/data/r', input('/data/r/q1'))])
    );

    const range = getUncontrolledRange(root);
    range.removeInstances(0);
    expect(range.getChildren().length).toBe(0);
    expect(findFirstVisibleControl(range)).toBeNull();
  });

  it('a question scope resolves to itself when relevant, null otherwise', async () => {
    const root = await initForm(
      buildForm(
        [t('toggle', 'no'), t('q1')],
        [input('/data/toggle'), input('/data/q1')],
        [
          bind('/data/toggle').type('string'),
          bind('/data/q1').type('string').relevant("/data/toggle = 'yes'"),
        ]
      )
    );

    const q1 = getControlNode(root, '/data/q1');
    expect(findFirstVisibleControl(q1)).toBeNull();

    getInputNode(root, '/data/toggle').setValue('yes');
    expect(findFirstVisibleControl(q1)).toBe(q1);
  });

  it('returns null for a question scope inside a non-relevant group', async () => {
    const root = await initForm(
      buildForm(
        [t('toggle', 'no'), t('g', t('q1'))],
        [input('/data/toggle'), group('/data/g', input('/data/g/q1'))],
        [bind('/data/toggle').type('string'), bind('/data/g').relevant("/data/toggle = 'yes'")]
      )
    );

    expect(findFirstVisibleControl(getControlNode(root, '/data/g/q1'))).toBeNull();
  });
});
