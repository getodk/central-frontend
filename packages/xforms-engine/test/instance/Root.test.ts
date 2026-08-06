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
} from '../helpers/pagination.ts';

describe('Root', () => {
  const buildForm = (
    instanceChildren: readonly XFormsElement[],
    bodyChildren: readonly XFormsElement[],
    binds: readonly XFormsElement[] = []
  ): XFormsElement => {
    return html(
      head(
        title('Root pagination'),
        model(mainInstance(t('data id="root-pagination"', ...instanceChildren)), ...binds)
      ),
      pagesBody(...bodyChildren)
    );
  };

  const threeQuestionForm = (): XFormsElement => {
    return buildForm(
      [t('q1'), t('q2'), t('q3')],
      [input('/data/q1'), input('/data/q2'), input('/data/q3')]
    );
  };

  describe('pagination navigation', () => {
    const initForm = setupPaginationForms();

    it('nextPage / previousPage step through boundaries and no-op at either end', async () => {
      const root = await initForm(threeQuestionForm());
      const q1 = getControlNode(root, '/data/q1');
      const q2 = getControlNode(root, '/data/q2');
      const q3 = getControlNode(root, '/data/q3');

      expect(root.currentState.currentPage).toBe(q1.nodeId);
      expect(root.currentState.canGoPrevious).toBe(false);
      expect(root.currentState.canGoNext).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(q2.nodeId);
      expect(root.currentState.canGoPrevious).toBe(true);
      expect(root.currentState.canGoNext).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(q3.nodeId);
      expect(root.currentState.canGoPrevious).toBe(true);
      expect(root.currentState.canGoNext).toBe(false);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(q3.nodeId);

      root.previousPage();
      expect(root.currentState.currentPage).toBe(q2.nodeId);

      root.previousPage();
      expect(root.currentState.currentPage).toBe(q1.nodeId);
      expect(root.currentState.canGoPrevious).toBe(false);

      root.previousPage();
      expect(root.currentState.currentPage).toBe(q1.nodeId);
    });

    it('setCurrentPage jumps directly to any boundary', async () => {
      const root = await initForm(threeQuestionForm());
      const q3 = getControlNode(root, '/data/q3');

      root.setCurrentPage(q3.nodeId);
      expect(root.currentState.currentPage).toBe(q3.nodeId);
      expect(root.currentState.canGoNext).toBe(false);
      expect(root.currentState.canGoPrevious).toBe(true);
    });

    it('nextPage skips unreachable (empty) pages', async () => {
      const root = await initForm(
        buildForm(
          [t('toggle', 'no'), t('gated'), t('tail')],
          [input('/data/toggle'), input('/data/gated'), input('/data/tail')],
          [
            bind('/data/toggle').type('string'),
            bind('/data/gated').type('string').relevant("/data/toggle = 'yes'"),
            bind('/data/tail').type('string'),
          ]
        )
      );
      const toggle = getControlNode(root, '/data/toggle');
      const tail = getControlNode(root, '/data/tail');

      expect(root.currentState.currentPage).toBe(toggle.nodeId);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(tail.nodeId);
    });

    it('auto-advances forward when the current page becomes empty', async () => {
      const root = await initForm(
        buildForm(
          [t('toggle', 'yes'), t('gated'), t('tail')],
          [input('/data/toggle'), input('/data/gated'), input('/data/tail')],
          [
            bind('/data/toggle').type('string'),
            bind('/data/gated').type('string').relevant("/data/toggle = 'yes'"),
            bind('/data/tail').type('string'),
          ]
        )
      );
      const gated = getControlNode(root, '/data/gated');
      const tail = getControlNode(root, '/data/tail');

      root.setCurrentPage(gated.nodeId);
      expect(root.currentState.currentPage).toBe(gated.nodeId);

      getInputNode(root, '/data/toggle').setValue('no');

      expect(root.currentState.currentPage).toBe(tail.nodeId);
    });

    it('canGoNext re-derives after first read when a new instance adds a page', async () => {
      const root = await initForm(
        buildForm(
          [t('r', t('x'))],
          [t('repeat nodeset="/data/r" appearance="field-list"', input('/data/r/x'))]
        )
      );

      expect(root.currentState.canGoNext).toBe(false);

      getUncontrolledRange(root).addInstances();

      expect(root.currentState.canGoNext).toBe(true);
    });

    it('auto-advances backward when nothing is reachable forward', async () => {
      const root = await initForm(
        buildForm(
          [t('toggle', 'yes'), t('keep'), t('gated')],
          [input('/data/toggle'), input('/data/keep'), input('/data/gated')],
          [
            bind('/data/toggle').type('string'),
            bind('/data/keep').type('string'),
            bind('/data/gated').type('string').relevant("/data/toggle = 'yes'"),
          ]
        )
      );
      const keep = getControlNode(root, '/data/keep');
      const gated = getControlNode(root, '/data/gated');

      root.setCurrentPage(gated.nodeId);
      expect(root.currentState.currentPage).toBe(gated.nodeId);

      getInputNode(root, '/data/toggle').setValue('no');

      expect(root.currentState.currentPage).toBe(keep.nodeId);
    });
  });

  describe('pagination — repeat structure changes', () => {
    const initForm = setupPaginationForms();

    const midFormRepeatForm = (
      ...instanceRepeatEntries: readonly XFormsElement[]
    ): XFormsElement => {
      return buildForm(
        [t('intro'), ...instanceRepeatEntries, t('tail')],
        [input('/data/intro'), repeat('/data/r', input('/data/r/q')), input('/data/tail')]
      );
    };

    it("inserts a new instance's page between its repeat and the next page", async () => {
      const root = await initForm(midFormRepeatForm(t('r', t('q'))));
      const r1q = getControlNode(root, '/data/r[1]/q');
      const tail = getControlNode(root, '/data/tail');

      root.setCurrentPage(r1q.nodeId);
      getUncontrolledRange(root).addInstances();

      const r2q = getControlNode(root, '/data/r[2]/q');

      root.nextPage();
      expect(root.currentState.currentPage).toBe(r2q.nodeId);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(tail.nodeId);
      expect(root.currentState.canGoNext).toBe(false);
    });

    it('an empty repeat outside any field-list is its own reachable page', async () => {
      const root = await initForm(midFormRepeatForm(t('r jr:template=""', t('q'))));
      const intro = getControlNode(root, '/data/intro');
      const tail = getControlNode(root, '/data/tail');
      const range = getUncontrolledRange(root);

      expect(root.currentState.currentPage).toBe(intro.nodeId);
      expect(root.currentState.canGoNext).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(range.nodeId);
      expect(root.currentState.canGoPrevious).toBe(true);
      expect(root.currentState.canGoNext).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(tail.nodeId);

      root.previousPage();
      expect(root.currentState.currentPage).toBe(range.nodeId);
    });

    it("adding the first instance auto-advances to the new instance's page", async () => {
      const root = await initForm(midFormRepeatForm(t('r jr:template=""', t('q'))));

      root.nextPage();
      getUncontrolledRange(root).addInstances();

      const r1q = getControlNode(root, '/data/r[1]/q');
      expect(root.currentState.currentPage).toBe(r1q.nodeId);
    });

    it("removing the only instance falls back to the now-empty range's page", async () => {
      const root = await initForm(midFormRepeatForm(t('r jr:template=""', t('q')), t('r', t('q'))));
      const r1q = getControlNode(root, '/data/r[1]/q');
      const range = getUncontrolledRange(root);

      root.setCurrentPage(r1q.nodeId);
      range.removeInstances(0);

      expect(root.currentState.currentPage).toBe(range.nodeId);
    });

    it('removing the current instance lands on a remaining instance', async () => {
      const root = await initForm(
        midFormRepeatForm(t('r jr:template=""', t('q')), t('r', t('q')), t('r', t('q')))
      );
      const r2q = getControlNode(root, '/data/r[2]/q');

      root.setCurrentPage(r2q.nodeId);
      getUncontrolledRange(root).removeInstances(1);

      const remaining = getControlNode(root, '/data/r[1]/q');
      expect(root.currentState.currentPage).toBe(remaining.nodeId);
    });
  });

  describe('pagination — repeats anchored inside field-list pages', () => {
    const initForm = setupPaginationForms();

    const flGroupWithNestedRepeatForm = (
      ...instanceOuterChildren: readonly XFormsElement[]
    ): XFormsElement => {
      return buildForm(
        [t('intro'), t('outer', ...instanceOuterChildren), t('tail')],
        [
          input('/data/intro'),
          t(
            'group ref="/data/outer" appearance="field-list"',
            input('/data/outer/a'),
            group('/data/outer/child', repeat('/data/outer/child', input('/data/outer/child/q'))),
            input('/data/outer/b')
          ),
          input('/data/tail'),
        ]
      );
    };

    const flOuterRepeatForm = (): XFormsElement => {
      return buildForm(
        [
          t('hh jr:template=""', t('hhname'), t('member jr:template=""', t('mname'))),
          t('hh', t('hhname'), t('member', t('mname'))),
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
      );
    };

    it('a field-list with a nested repeat is a single page between its neighbors', async () => {
      const root = await initForm(flGroupWithNestedRepeatForm(t('a'), t('child', t('q')), t('b')));
      const intro = getControlNode(root, '/data/intro');
      const outer = getGroupNode(root, '/data/outer');
      const tail = getControlNode(root, '/data/tail');

      expect(root.currentState.currentPage).toBe(intro.nodeId);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(outer.nodeId);
      expect(root.currentState.canGoPrevious).toBe(true);
      expect(root.currentState.canGoNext).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(tail.nodeId);
      expect(root.currentState.canGoNext).toBe(false);
    });

    it('adding an instance inside a field-list keeps currentPage on that page', async () => {
      const root = await initForm(flGroupWithNestedRepeatForm(t('a'), t('child', t('q')), t('b')));
      const outer = getGroupNode(root, '/data/outer');
      const tail = getControlNode(root, '/data/tail');

      root.setCurrentPage(outer.nodeId);
      getUncontrolledRange(root).addInstances();

      expect(root.currentState.currentPage).toBe(outer.nodeId);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(tail.nodeId);
    });

    it('an empty repeat pages with its field-list and stays put on first add', async () => {
      const root = await initForm(
        flGroupWithNestedRepeatForm(t('a'), t('child jr:template=""', t('q')), t('b'))
      );
      const outer = getGroupNode(root, '/data/outer');
      const tail = getControlNode(root, '/data/tail');
      const range = getUncontrolledRange(root);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(outer.nodeId);
      expect(root.currentState.currentPage).not.toBe(range.nodeId);

      range.addInstances();
      expect(root.currentState.currentPage).toBe(outer.nodeId);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(tail.nodeId);
    });

    it('a field-list with only an empty repeat is still a reachable page', async () => {
      const root = await initForm(
        buildForm(
          [t('intro'), t('fl', t('r jr:template=""', t('q'))), t('tail')],
          [
            input('/data/intro'),
            t(
              'group ref="/data/fl" appearance="field-list"',
              repeat('/data/fl/r', input('/data/fl/r/q'))
            ),
            input('/data/tail'),
          ]
        )
      );
      const fl = getGroupNode(root, '/data/fl');

      root.nextPage();
      expect(root.currentState.currentPage).toBe(fl.nodeId);

      getUncontrolledRange(root).addInstances();
      expect(root.currentState.currentPage).toBe(fl.nodeId);
    });

    it('field-list on an outer repeat, inner structure changes stay on-page', async () => {
      const root = await initForm(flOuterRepeatForm());
      const hh1 = getRepeatInstanceNode(root, '/data/hh[1]');
      const hh2 = getRepeatInstanceNode(root, '/data/hh[2]');

      expect(root.currentState.currentPage).toBe(hh1.nodeId);
      expect(root.currentState.canGoNext).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(hh2.nodeId);
      expect(root.currentState.canGoNext).toBe(false);

      getUncontrolledRange(hh2).addInstances();
      expect(root.currentState.currentPage).toBe(hh2.nodeId);
      expect(root.currentState.canGoNext).toBe(false);
      expect(root.currentState.canGoPrevious).toBe(true);
    });

    it('removing the current outer instance recovers to a remaining instance', async () => {
      const root = await initForm(flOuterRepeatForm());
      const hh1 = getRepeatInstanceNode(root, '/data/hh[1]');
      const hh2 = getRepeatInstanceNode(root, '/data/hh[2]');

      root.setCurrentPage(hh2.nodeId);
      getUncontrolledRange(root).removeInstances(1);

      expect(root.currentState.currentPage).toBe(hh1.nodeId);
    });
  });
});
