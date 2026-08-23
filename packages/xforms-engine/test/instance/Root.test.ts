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
      expect(root.currentState.hasPreviousPage).toBe(false);
      expect(root.currentState.hasNextPage).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(q2.nodeId);
      expect(root.currentState.hasPreviousPage).toBe(true);
      expect(root.currentState.hasNextPage).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(q3.nodeId);
      expect(root.currentState.hasPreviousPage).toBe(true);
      expect(root.currentState.hasNextPage).toBe(false);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(q3.nodeId);

      root.previousPage();
      expect(root.currentState.currentPage).toBe(q2.nodeId);

      root.previousPage();
      expect(root.currentState.currentPage).toBe(q1.nodeId);
      expect(root.currentState.hasPreviousPage).toBe(false);

      root.previousPage();
      expect(root.currentState.currentPage).toBe(q1.nodeId);
    });

    it('setCurrentPage jumps directly to any boundary', async () => {
      const root = await initForm(threeQuestionForm());
      const q3 = getControlNode(root, '/data/q3');

      root.setCurrentPage(q3.nodeId);
      expect(root.currentState.currentPage).toBe(q3.nodeId);
      expect(root.currentState.hasNextPage).toBe(false);
      expect(root.currentState.hasPreviousPage).toBe(true);
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

    it('adding an instance navigates to it and updates the navigation state', async () => {
      const root = await initForm(
        buildForm(
          [t('r', t('x'))],
          [t('repeat nodeset="/data/r" appearance="field-list"', input('/data/r/x'))]
        )
      );

      expect(root.currentState.hasNextPage).toBe(false);
      expect(root.currentState.hasPreviousPage).toBe(false);

      getUncontrolledRange(root).addInstances();

      const repeatInstance = getRepeatInstanceNode(root, '/data/r[2]');
      expect(root.currentState.currentPage).toBe(repeatInstance.nodeId);
      expect(root.currentState.hasPreviousPage).toBe(true);
      expect(root.currentState.hasNextPage).toBe(false);
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

    // Edge case and not a bug, still worth documenting as a test scenario here.
    it('clears the current page when the current instance is removed and no page remains reachable', async () => {
      const root = await initForm(
        buildForm(
          [t('grp', t('r jr:template=""', t('q')), t('r', t('q'))), t('n')],
          [group('/data/grp', repeat('/data/grp/r', input('/data/grp/r/q')))],
          [
            bind('/data/n').type('string').calculate('count(/data/grp/r)'),
            bind('/data/grp').relevant('/data/n > 0'),
          ]
        )
      );
      const r1q = getControlNode(root, '/data/grp/r[1]/q');

      expect(root.currentState.currentPage).toBe(r1q.nodeId);

      getUncontrolledRange(root).removeInstances(0);

      expect(root.currentState.currentPage).toBe(null);
      expect(root.currentState.hasNextPage).toBe(false);
      expect(root.currentState.hasPreviousPage).toBe(false);
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

    it('adding an instance navigates to the page of the new instance, kept in document order', async () => {
      const root = await initForm(midFormRepeatForm(t('r', t('q'))));
      const r1q = getControlNode(root, '/data/r[1]/q');
      const tail = getControlNode(root, '/data/tail');

      root.setCurrentPage(r1q.nodeId);
      getUncontrolledRange(root).addInstances();

      const r2q = getControlNode(root, '/data/r[2]/q');
      expect(root.currentState.currentPage).toBe(r2q.nodeId);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(tail.nodeId);
      expect(root.currentState.hasNextPage).toBe(false);
    });

    it('an empty repeat outside any field-list is its own reachable page', async () => {
      const root = await initForm(midFormRepeatForm(t('r jr:template=""', t('q'))));
      const intro = getControlNode(root, '/data/intro');
      const tail = getControlNode(root, '/data/tail');
      const range = getUncontrolledRange(root);

      expect(root.currentState.currentPage).toBe(intro.nodeId);
      expect(root.currentState.hasNextPage).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(range.nodeId);
      expect(root.currentState.hasPreviousPage).toBe(true);
      expect(root.currentState.hasNextPage).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(tail.nodeId);

      root.previousPage();
      expect(root.currentState.currentPage).toBe(range.nodeId);
    });

    it('adding the first instance auto-advances to the page of the new instance', async () => {
      const root = await initForm(midFormRepeatForm(t('r jr:template=""', t('q'))));

      root.nextPage();
      getUncontrolledRange(root).addInstances();

      const r1q = getControlNode(root, '/data/r[1]/q');
      expect(root.currentState.currentPage).toBe(r1q.nodeId);
    });

    it('removing the only instance falls back to the page of the now-empty range', async () => {
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
      expect(root.currentState.hasPreviousPage).toBe(true);
      expect(root.currentState.hasNextPage).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(tail.nodeId);
      expect(root.currentState.hasNextPage).toBe(false);
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
      expect(root.currentState.hasNextPage).toBe(true);

      root.nextPage();
      expect(root.currentState.currentPage).toBe(hh2.nodeId);
      expect(root.currentState.hasNextPage).toBe(false);

      getUncontrolledRange(hh2).addInstances();
      expect(root.currentState.currentPage).toBe(hh2.nodeId);
      expect(root.currentState.hasNextPage).toBe(false);
      expect(root.currentState.hasPreviousPage).toBe(true);
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

  describe('navigation target', () => {
    const initForm = setupPaginationForms();

    it('targets the first control of the page on load and on page change', async () => {
      const root = await initForm(threeQuestionForm());
      const q1 = getControlNode(root, '/data/q1');
      const q2 = getControlNode(root, '/data/q2');

      expect(root.currentState.navigationTarget).toBe(q1.nodeId);

      root.nextPage();
      expect(root.currentState.navigationTarget).toBe(q2.nodeId);
    });

    it('keeps the target when relevance changes within the current page', async () => {
      const root = await initForm(
        buildForm(
          [t('toggle', 'no'), t('g', t('q1'), t('q2'))],
          [
            input('/data/toggle'),
            t(
              'group ref="/data/g" appearance="field-list"',
              input('/data/g/q1'),
              input('/data/g/q2')
            ),
          ],
          [
            bind('/data/toggle').type('string'),
            bind('/data/g/q1').type('string').relevant("/data/toggle = 'yes'"),
          ]
        )
      );
      const q2 = getControlNode(root, '/data/g/q2');

      root.nextPage();
      expect(root.currentState.navigationTarget).toBe(q2.nodeId);

      getInputNode(root, '/data/toggle').setValue('yes');
      expect(root.currentState.navigationTarget).toBe(q2.nodeId);
    });

    it('adding an instance to a repeat in a field-list targets the first control of the new instance, not its page.', async () => {
      const root = await initForm(
        buildForm(
          [t('fl', t('intro'), t('r', t('q')))],
          [
            t(
              'group ref="/data/fl" appearance="field-list"',
              input('/data/fl/intro'),
              repeat('/data/fl/r', input('/data/fl/r/q'))
            ),
          ]
        )
      );

      getUncontrolledRange(root).addInstances();

      const newInstanceQuestion = getControlNode(root, '/data/fl/r[2]/q');
      expect(root.currentState.navigationTarget).toBe(newInstanceQuestion.nodeId);
    });

    it('removing an instance targets the instance that takes its position', async () => {
      const root = await initForm(
        buildForm(
          [t('r', t('q')), t('r', t('q')), t('r', t('q'))],
          [repeat('/data/r', input('/data/r/q'))]
        )
      );

      root.setCurrentPage(getControlNode(root, '/data/r[2]/q').nodeId);
      getUncontrolledRange(root).removeInstances(1);

      const replacementQuestion = getControlNode(root, '/data/r[2]/q');
      expect(root.currentState.currentPage).toBe(replacementQuestion.nodeId);
      expect(root.currentState.navigationTarget).toBe(replacementQuestion.nodeId);
    });

    it('removing the last instance targets the range, where Add renders', async () => {
      const root = await initForm(
        buildForm(
          [t('intro'), t('r', t('q')), t('tail')],
          [input('/data/intro'), repeat('/data/r', input('/data/r/q')), input('/data/tail')]
        )
      );
      const range = getUncontrolledRange(root);

      root.setCurrentPage(getControlNode(root, '/data/r[1]/q').nodeId);
      range.removeInstances(0);

      expect(root.currentState.navigationTarget).toBe(range.nodeId);
    });

    it('removing the last instance in the list targets the previous instance', async () => {
      const root = await initForm(
        buildForm(
          [t('r', t('q')), t('r', t('q'))],
          [repeat('/data/r', input('/data/r/q'))]
        )
      );

      root.setCurrentPage(getControlNode(root, '/data/r[2]/q').nodeId);
      getUncontrolledRange(root).removeInstances(1);

      const previousQuestion = getControlNode(root, '/data/r[1]/q');
      expect(root.currentState.currentPage).toBe(previousQuestion.nodeId);
      expect(root.currentState.navigationTarget).toBe(previousQuestion.nodeId);
    });

    it('removing an instance on a non-paginated form does not navigate', async () => {
      const root = await initForm(
        html(
          head(
            title('Pageless form'),
            model(mainInstance(t('data id="root"', t('r', t('q')), t('r', t('q')))))
          ),
          body(repeat('/data/r', input('/data/r/q')))
        )
      );
      const firstQuestion = getControlNode(root, '/data/r[1]/q');
      expect(root.currentState.navigationTarget).toBe(firstQuestion.nodeId);

      getUncontrolledRange(root).removeInstances(1);

      expect(root.currentState.navigationTarget).toBe(firstQuestion.nodeId);
    });

    it('a non-paginated form targets its first control on load', async () => {
      const root = await initForm(
        html(
          head(
            title('Root pagination'),
            model(mainInstance(t('data id="root-pagination"', t('q1'), t('q2'))))
          ),
          body(input('/data/q1'), input('/data/q2'))
        )
      );

      expect(root.currentState.navigationTarget).toBe(getControlNode(root, '/data/q1').nodeId);
    });

    it('navigateToFirstViolation moves to the first violating control', async () => {
      const root = await initForm(
        buildForm(
          [t('q1'), t('q2')],
          [input('/data/q1'), input('/data/q2')],
          [bind('/data/q2').type('string').required()]
        )
      );
      const q2 = getControlNode(root, '/data/q2');

      root.navigateToFirstViolation();

      expect(root.currentState.currentPage).toBe(q2.nodeId);
      expect(root.currentState.navigationTarget).toBe(q2.nodeId);
    });
  });
});
