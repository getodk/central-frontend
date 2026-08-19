import {
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
import { resolveFieldListPage } from '../../../src/instance/pagination/resolveFieldListPage.ts';
import {
  getControlNode,
  getGroupNode,
  getRepeatInstanceNode,
  pagesBody,
  setupPaginationForms,
} from '../../helpers/pagination.ts';

describe('resolveFieldListPage', () => {
  const buildForm = (
    instanceChildren: readonly XFormsElement[],
    bodyChildren: readonly XFormsElement[]
  ): XFormsElement => {
    return html(
      head(
        title('resolveFieldListPage'),
        model(mainInstance(t('data id="resolve-field-list-page"', ...instanceChildren)))
      ),
      pagesBody(...bodyChildren)
    );
  };

  const initForm = setupPaginationForms();

  describe('a leaf with no enclosing field-list resolves to null and is its own page', () => {
    it('flat leaves at the root', async () => {
      const root = await initForm(
        buildForm([t('q1'), t('q2')], [input('/data/q1'), input('/data/q2')])
      );

      expect(resolveFieldListPage(getControlNode(root, '/data/q1'))).toBeNull();
      expect(resolveFieldListPage(getControlNode(root, '/data/q2'))).toBeNull();
    });

    it('a plain group is not a page container', async () => {
      const root = await initForm(
        buildForm(
          [t('q1'), t('g', t('a'), t('b'))],
          [input('/data/q1'), group('/data/g', input('/data/g/a'), input('/data/g/b'))]
        )
      );

      expect(resolveFieldListPage(getControlNode(root, '/data/q1'))).toBeNull();
      expect(resolveFieldListPage(getControlNode(root, '/data/g/a'))).toBeNull();
      expect(resolveFieldListPage(getControlNode(root, '/data/g/b'))).toBeNull();
    });
  });

  describe('field-list group anchors', () => {
    it('all leaves of a field-list group share it as their page', async () => {
      const root = await initForm(
        buildForm(
          [t('fl', t('a'), t('b'), t('c'))],
          [
            t(
              'group ref="/data/fl" appearance="field-list"',
              input('/data/fl/a'),
              input('/data/fl/b'),
              input('/data/fl/c')
            ),
          ]
        )
      );

      const fl = getGroupNode(root, '/data/fl');

      expect(resolveFieldListPage(getControlNode(root, '/data/fl/a'))).toBe(fl);
      expect(resolveFieldListPage(getControlNode(root, '/data/fl/b'))).toBe(fl);
      expect(resolveFieldListPage(getControlNode(root, '/data/fl/c'))).toBe(fl);
    });

    it('nested field-list groups: the outermost wins', async () => {
      const root = await initForm(
        buildForm(
          [t('outer', t('a'), t('inner', t('b')))],
          [
            t(
              'group ref="/data/outer" appearance="field-list"',
              input('/data/outer/a'),
              t(
                'group ref="/data/outer/inner" appearance="field-list"',
                input('/data/outer/inner/b')
              )
            ),
          ]
        )
      );

      const outer = getGroupNode(root, '/data/outer');

      expect(resolveFieldListPage(getControlNode(root, '/data/outer/a'))).toBe(outer);
      expect(resolveFieldListPage(getControlNode(root, '/data/outer/inner/b'))).toBe(outer);
    });

    it('a field-list inside a plain group pages only its own leaves', async () => {
      const root = await initForm(
        buildForm(
          [t('g', t('a'), t('fl', t('x'), t('y')), t('d'))],
          [
            group(
              '/data/g',
              input('/data/g/a'),
              t(
                'group ref="/data/g/fl" appearance="field-list"',
                input('/data/g/fl/x'),
                input('/data/g/fl/y')
              ),
              input('/data/g/d')
            ),
          ]
        )
      );

      const fl = getGroupNode(root, '/data/g/fl');

      expect(resolveFieldListPage(getControlNode(root, '/data/g/a'))).toBeNull();
      expect(resolveFieldListPage(getControlNode(root, '/data/g/fl/x'))).toBe(fl);
      expect(resolveFieldListPage(getControlNode(root, '/data/g/fl/y'))).toBe(fl);
      expect(resolveFieldListPage(getControlNode(root, '/data/g/d'))).toBeNull();
    });
  });

  describe('field-list scope crosses repeat boundaries', () => {
    it('a field-list wrapping a repeat (group ref ≠ nodeset) pages interior leaves', async () => {
      const root = await initForm(
        buildForm(
          [t('intro'), t('fl', t('r', t('q1'), t('q2')), t('r', t('q1'), t('q2')))],
          [
            input('/data/intro'),
            t(
              'group ref="/data/fl" appearance="field-list"',
              repeat('/data/fl/r', input('/data/fl/r/q1'), input('/data/fl/r/q2'))
            ),
          ]
        )
      );

      const fl = getGroupNode(root, '/data/fl');

      expect(resolveFieldListPage(getControlNode(root, '/data/intro'))).toBeNull();
      expect(resolveFieldListPage(getControlNode(root, '/data/fl/r[1]/q1'))).toBe(fl);
      expect(resolveFieldListPage(getControlNode(root, '/data/fl/r[1]/q2'))).toBe(fl);
      expect(resolveFieldListPage(getControlNode(root, '/data/fl/r[2]/q1'))).toBe(fl);
    });

    it('a ghost-group field-list (group ref == nodeset) pages each RepeatInstance', async () => {
      const root = await initForm(
        buildForm(
          [t('intro'), t('r', t('q1'), t('q2')), t('r', t('q1'), t('q2'))],
          [
            input('/data/intro'),
            t(
              'group ref="/data/r" appearance="field-list"',
              repeat('/data/r', input('/data/r/q1'), input('/data/r/q2'))
            ),
          ]
        )
      );

      const r1 = getRepeatInstanceNode(root, '/data/r[1]');
      const r2 = getRepeatInstanceNode(root, '/data/r[2]');

      expect(resolveFieldListPage(getControlNode(root, '/data/intro'))).toBeNull();
      expect(resolveFieldListPage(getControlNode(root, '/data/r[1]/q1'))).toBe(r1);
      expect(resolveFieldListPage(getControlNode(root, '/data/r[1]/q2'))).toBe(r1);
      expect(resolveFieldListPage(getControlNode(root, '/data/r[2]/q1'))).toBe(r2);
    });

    it('a field-list with a repeat and sibling leaves shares one page', async () => {
      const root = await initForm(
        buildForm(
          [t('outer', t('a'), t('child', t('q')), t('child', t('q')), t('b'))],
          [
            t(
              'group ref="/data/outer" appearance="field-list"',
              input('/data/outer/a'),
              group('/data/outer/child', repeat('/data/outer/child', input('/data/outer/child/q'))),
              input('/data/outer/b')
            ),
          ]
        )
      );

      const outer = getGroupNode(root, '/data/outer');

      expect(resolveFieldListPage(getControlNode(root, '/data/outer/a'))).toBe(outer);
      expect(resolveFieldListPage(getControlNode(root, '/data/outer/b'))).toBe(outer);
      expect(resolveFieldListPage(getControlNode(root, '/data/outer/child[1]/q'))).toBe(outer);
      expect(resolveFieldListPage(getControlNode(root, '/data/outer/child[2]/q'))).toBe(outer);
    });

    it('field-list on an outer repeat pages every leaf to its outer instance', async () => {
      const root = await initForm(
        buildForm(
          [
            t('hh', t('hhname'), t('member', t('mname')), t('member', t('mname'))),
            t('hh', t('hhname'), t('member', t('mname'))),
          ],
          [
            group(
              '/data/hh',
              t(
                'repeat nodeset="/data/hh" appearance="field-list"',
                input('/data/hh/hhname'),
                group('/data/hh/member', repeat('/data/hh/member', input('/data/hh/member/mname')))
              )
            ),
          ]
        )
      );

      const hh1 = getRepeatInstanceNode(root, '/data/hh[1]');
      const hh2 = getRepeatInstanceNode(root, '/data/hh[2]');

      expect(resolveFieldListPage(getControlNode(root, '/data/hh[1]/hhname'))).toBe(hh1);
      expect(resolveFieldListPage(getControlNode(root, '/data/hh[1]/member[1]/mname'))).toBe(hh1);
      expect(resolveFieldListPage(getControlNode(root, '/data/hh[1]/member[2]/mname'))).toBe(hh1);
      expect(resolveFieldListPage(getControlNode(root, '/data/hh[2]/member[1]/mname'))).toBe(hh2);
    });

    it('a field-list group wrapping a field-list repeat: the group wins', async () => {
      const root = await initForm(
        buildForm(
          [t('wrap', t('r', t('q')), t('r', t('q')))],
          [
            t(
              'group ref="/data/wrap" appearance="field-list"',
              group(
                '/data/wrap/r',
                t('repeat nodeset="/data/wrap/r" appearance="field-list"', input('/data/wrap/r/q'))
              )
            ),
          ]
        )
      );

      const outerFl = getGroupNode(root, '/data/wrap');

      expect(resolveFieldListPage(getControlNode(root, '/data/wrap/r[1]/q'))).toBe(outerFl);
      expect(resolveFieldListPage(getControlNode(root, '/data/wrap/r[2]/q'))).toBe(outerFl);
    });

    it('a field-list inside a plain repeat pages its interior leaves only', async () => {
      const root = await initForm(
        buildForm(
          [t('r', t('name'), t('details', t('age'), t('sex')), t('notes'))],
          [
            repeat(
              '/data/r',
              input('/data/r/name'),
              t(
                'group ref="/data/r/details" appearance="field-list"',
                input('/data/r/details/age'),
                input('/data/r/details/sex')
              ),
              input('/data/r/notes')
            ),
          ]
        )
      );

      const details = getGroupNode(root, '/data/r[1]/details');

      expect(resolveFieldListPage(getControlNode(root, '/data/r[1]/name'))).toBeNull();
      expect(resolveFieldListPage(getControlNode(root, '/data/r[1]/details/age'))).toBe(details);
      expect(resolveFieldListPage(getControlNode(root, '/data/r[1]/details/sex'))).toBe(details);
      expect(resolveFieldListPage(getControlNode(root, '/data/r[1]/notes'))).toBeNull();
    });

    it('field-list on the <repeat> element itself: each RepeatInstance is a page', async () => {
      const root = await initForm(
        buildForm(
          [t('r', t('a'), t('b')), t('r', t('a'), t('b'))],
          [
            t(
              'repeat nodeset="/data/r" appearance="field-list"',
              input('/data/r/a'),
              input('/data/r/b')
            ),
          ]
        )
      );

      const r1 = getRepeatInstanceNode(root, '/data/r[1]');
      const r2 = getRepeatInstanceNode(root, '/data/r[2]');

      expect(resolveFieldListPage(getControlNode(root, '/data/r[1]/a'))).toBe(r1);
      expect(resolveFieldListPage(getControlNode(root, '/data/r[1]/b'))).toBe(r1);
      expect(resolveFieldListPage(getControlNode(root, '/data/r[2]/a'))).toBe(r2);
    });
  });
});
