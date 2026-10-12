import {
  getNearestStepDistance,
  getRangeRatio,
  getRangeScale,
  getRangeTicks,
  getRangeValueAfterSteps,
  getRangeValueAtRatio,
  placeLabelsOnTicks,
} from '@getodk/web-forms/components/form-elements/range/range-scale.ts';
import type { RangeScale } from '@getodk/web-forms/components/form-elements/range/range-scale.ts';
import type { RangeTickLabel, TextRange } from '@getodk/xforms-engine';
import { describe, expect, it } from 'vitest';

describe('Range scale', () => {
  const bounds = { start: 0, end: 10, step: 1 };
  const scale = getRangeScale(bounds);
  const decimalScale = getRangeScale({ start: 0, end: 1, step: 0.1 });
  const reversedScale = getRangeScale({ start: 10, end: 0, step: 2 });
  const unevenScale = getRangeScale({ start: 0, end: 10, step: 3 });
  const emptyScale = getRangeScale({ start: 5, end: 5, step: 1 });
  const zeroStepScale = getRangeScale({ start: 2, end: 10, step: 0 });

  describe('getRangeRatio', () => {
    it('returns the position of the value between start and end', () => {
      expect(getRangeRatio(scale, 0)).toBe(0);
      expect(getRangeRatio(scale, 5)).toBe(0.5);
      expect(getRangeRatio(scale, 10)).toBe(1);
      expect(getRangeRatio(decimalScale, 0.3)).toBe(0.3);
    });

    it('measures the position from start when start is larger than end', () => {
      expect(getRangeRatio(reversedScale, 8)).toBe(0.2);
    });

    it('keeps the position of a value between steps', () => {
      const twoStepScale = getRangeScale({ start: 0, end: 10, step: 2 });

      expect(getRangeRatio(twoStepScale, 7.5)).toBe(0.75);
      expect(getRangeRatio(decimalScale, 0.333)).toBe(0.333);
    });

    it('returns zero when start equals end', () => {
      expect(getRangeRatio(emptyScale, 5)).toBe(0);
    });
  });

  describe('getRangeValueAtRatio', () => {
    it('returns the closest allowed value', () => {
      expect(getRangeValueAtRatio(scale, 0.04)).toBe(0);
      expect(getRangeValueAtRatio(scale, 0.06)).toBe(1);
      expect(getRangeValueAtRatio(scale, 0.96)).toBe(10);
    });

    it('returns decimal values without floating point errors', () => {
      expect(getRangeValueAtRatio(decimalScale, 0.3)).toBe(0.3);
      expect(getRangeValueAtRatio(decimalScale, 0.7)).toBe(0.7);
    });

    it('returns values from start when start is larger than end', () => {
      expect(getRangeValueAtRatio(reversedScale, 0)).toBe(10);
      expect(getRangeValueAtRatio(reversedScale, 0.2)).toBe(8);
      expect(getRangeValueAtRatio(reversedScale, 1)).toBe(0);
    });

    it('returns the last allowed value when the step does not fit evenly', () => {
      expect(getRangeValueAtRatio(unevenScale, 1)).toBe(9);
    });

    it('returns start when the step is zero', () => {
      expect(getRangeValueAtRatio(zeroStepScale, 0.5)).toBe(2);
    });
  });

  describe('getRangeTicks', () => {
    const getTickCount = (tickInterval: number, tickBounds = bounds) => {
      const tickScale = getRangeScale({ ...tickBounds, tickInterval });
      return getRangeTicks(tickScale).length;
    };

    it('places a tick on every step, including start and end', () => {
      expect(getRangeTicks(reversedScale)).toEqual([
        { value: 10, distance: 0, ratio: 0 },
        { value: 8, distance: 2, ratio: 0.2 },
        { value: 6, distance: 4, ratio: 0.4 },
        { value: 4, distance: 6, ratio: 0.6 },
        { value: 2, distance: 8, ratio: 0.8 },
        { value: 0, distance: 10, ratio: 1 },
      ]);
      expect(getRangeTicks(scale)).toHaveLength(11);
      expect(getRangeTicks(decimalScale).map((tick) => tick.value)).toEqual([
        0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
      ]);
    });

    it('places a tick on every tick interval, including start and end', () => {
      expect(getTickCount(2)).toBe(6);
      expect(getTickCount(10)).toBe(2);
      expect(getTickCount(0.5, { start: 0, end: 1, step: 0.1 })).toBe(3);
    });

    it('ignores an invalid tick interval and places a tick on every step', () => {
      // Not a multiple of the step.
      expect(getTickCount(2.5)).toBe(11);
      expect(getTickCount(5, { start: 0, end: 10, step: 2 })).toBe(6);
      // Does not divide the range evenly.
      expect(getTickCount(3)).toBe(11);
      // Larger than the range.
      expect(getTickCount(20)).toBe(11);
      // Zero or negative.
      expect(getTickCount(0)).toBe(11);
      expect(getTickCount(-2)).toBe(11);
    });

    it('places no ticks when the range is not valid', () => {
      const oversizedStepScale = getRangeScale({ start: 0, end: 10, step: 15 });

      expect(getRangeTicks(zeroStepScale)).toEqual([]);
      expect(getRangeTicks(emptyScale)).toEqual([]);
      expect(getRangeTicks(oversizedStepScale)).toEqual([]);
      expect(getRangeTicks(unevenScale)).toEqual([]);
    });
  });

  describe('getNearestStepDistance', () => {
    it('measures the nearest step from start in whole numbers', () => {
      expect(getNearestStepDistance(scale, 0)).toBe(0);
      expect(getNearestStepDistance(scale, 3)).toBe(3);
      expect(getNearestStepDistance(scale, 3.4)).toBe(3);
      expect(getNearestStepDistance(decimalScale, 0.3)).toBe(3);
      expect(getNearestStepDistance(reversedScale, 6)).toBe(4);
    });

    it('returns zero when the step is zero', () => {
      expect(getNearestStepDistance(zeroStepScale, 5)).toBe(0);
    });
  });

  describe('placeLabelsOnTicks', () => {
    const tickLabel = (value: number, text = String(value)): RangeTickLabel => ({
      value,
      label: { asString: text } as TextRange<'item-label'>,
    });

    const positionLabels = (
      labelScale: RangeScale,
      values: readonly number[],
      endLabelsOnly = false
    ) => {
      const ticks = getRangeTicks(labelScale);
      const labels = values.map((value) => tickLabel(value));
      const positioned = placeLabelsOnTicks(ticks, labels, endLabelsOnly);
      return positioned.map(({ ratio, label }) => [ratio, label.asString]);
    };

    it('places a label on every step, sorted from start', () => {
      expect(positionLabels(scale, [10, 0, 5])).toEqual([
        [0, '0'],
        [0.5, '5'],
        [1, '10'],
      ]);
    });

    it('places labels on the tick interval only', () => {
      const tickIntervalScale = getRangeScale({ ...bounds, tickInterval: 5 });

      expect(positionLabels(tickIntervalScale, [0, 3, 5, 10])).toEqual([
        [0, '0'],
        [0.5, '5'],
        [1, '10'],
      ]);
    });

    it('places decimal labels', () => {
      expect(positionLabels(decimalScale, [0.5])).toEqual([[0.5, '0.5']]);
    });

    it('measures from start when start is larger than end', () => {
      expect(positionLabels(reversedScale, [10, 6, 0])).toEqual([
        [0, '10'],
        [0.4, '6'],
        [1, '0'],
      ]);
    });

    it('ignores a value which is not on a tick', () => {
      expect(positionLabels(decimalScale, [0.333, 0.3])).toEqual([[0.3, '0.3']]);
      expect(positionLabels(reversedScale, [3])).toEqual([]);
    });

    it('places only start and end labels without ticks', () => {
      expect(positionLabels(scale, [0, 5, 10], true)).toEqual([
        [0, '0'],
        [1, '10'],
      ]);
    });

    it('skips a label without text, such as an image only label', () => {
      const ticks = getRangeTicks(scale);
      const labels = [tickLabel(0, ''), tickLabel(5, ' '), tickLabel(10, 'High')];

      const positioned = placeLabelsOnTicks(ticks, labels, false);

      expect(positioned.map(({ ratio }) => ratio)).toEqual([1]);
    });
  });

  describe('getRangeValueAfterSteps', () => {
    it('moves the value by the number of steps', () => {
      expect(getRangeValueAfterSteps(scale, 5, 1)).toBe(6);
      expect(getRangeValueAfterSteps(scale, 5, -1)).toBe(4);
      expect(getRangeValueAfterSteps(decimalScale, 0.2, 1)).toBe(0.3);
    });

    it('moves towards end when start is larger than end', () => {
      expect(getRangeValueAfterSteps(reversedScale, 8, 1)).toBe(6);
    });

    it('does not move past start or end', () => {
      expect(getRangeValueAfterSteps(scale, 0, -1)).toBe(0);
      expect(getRangeValueAfterSteps(scale, 10, 1)).toBe(10);
    });
  });
});
