import {
  getRangeRatio,
  getRangeScale,
  getRangeTickCount,
  countTicksCoveredByValue,
  getRangeValueAfterSteps,
  getRangeValueAtRatio,
} from '@getodk/web-forms/components/form-elements/range/range-scale.ts';
import { describe, expect, it } from 'vitest';

describe('Range scale', () => {
  const bounds = { start: 0, end: 10, step: 1 };
  const reversedBounds = { start: 10, end: 0, step: 2 };
  const scale = getRangeScale(bounds);
  const decimalScale = getRangeScale({ start: 0, end: 1, step: 0.1 });
  const reversedScale = getRangeScale(reversedBounds);
  const unevenScale = getRangeScale({ start: 0, end: 10, step: 3 });

  describe('getRangeRatio', () => {
    it('returns the position of the value between start and end', () => {
      expect(getRangeRatio(bounds, 0)).toBe(0);
      expect(getRangeRatio(bounds, 5)).toBe(0.5);
      expect(getRangeRatio(bounds, 10)).toBe(1);
    });

    it('measures the position from start when start is larger than end', () => {
      expect(getRangeRatio(reversedBounds, 8)).toBe(0.2);
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
      expect(getRangeValueAtRatio(getRangeScale({ start: 2, end: 10, step: 0 }), 0.5)).toBe(2);
    });
  });

  describe('getRangeTickCount', () => {
    const getTickCount = (tickInterval: number, tickBounds = bounds) => {
      return getRangeTickCount(getRangeScale({ ...tickBounds, tickInterval }));
    };

    it('returns a tick for every step, including start and end', () => {
      expect(getRangeTickCount(scale)).toBe(11);
      expect(getRangeTickCount(decimalScale)).toBe(11);
      expect(getRangeTickCount(reversedScale)).toBe(6);
    });

    it('returns a tick for every tick interval, including start and end', () => {
      expect(getTickCount(2)).toBe(6);
      expect(getTickCount(10)).toBe(2);
      expect(getTickCount(0.5, { start: 0, end: 1, step: 0.1 })).toBe(3);
    });

    it('ignores a tick interval that is not a multiple of the step', () => {
      expect(getTickCount(2.5)).toBe(11);
      expect(getTickCount(5, { start: 0, end: 10, step: 2 })).toBe(6);
    });

    it('ignores a tick interval that does not divide the range evenly', () => {
      expect(getTickCount(3)).toBe(11);
    });

    it('ignores a tick interval larger than the range', () => {
      expect(getTickCount(20)).toBe(11);
    });

    it('ignores a tick interval that is zero or negative', () => {
      expect(getTickCount(0)).toBe(11);
      expect(getTickCount(-2)).toBe(11);
    });

    it('returns zero when the range is not valid', () => {
      expect(getRangeTickCount(getRangeScale({ start: 2, end: 10, step: 0 }))).toBe(0);
      expect(getRangeTickCount(getRangeScale({ start: 5, end: 5, step: 1 }))).toBe(0);
      expect(getRangeTickCount(getRangeScale({ start: 0, end: 10, step: 15 }))).toBe(0);
      expect(getRangeTickCount(unevenScale)).toBe(0);
    });
  });

  describe('countTicksCoveredByValue', () => {
    it('counts the ticks from start up to the value', () => {
      expect(countTicksCoveredByValue(scale, 0)).toBe(1);
      expect(countTicksCoveredByValue(scale, 3)).toBe(4);
      expect(countTicksCoveredByValue(scale, 10)).toBe(11);
      expect(countTicksCoveredByValue(decimalScale, 0.3)).toBe(4);
      expect(countTicksCoveredByValue(reversedScale, 6)).toBe(3);
    });

    it('counts by tick interval when one is set', () => {
      const tickScale = getRangeScale({ ...bounds, tickInterval: 2 });
      expect(countTicksCoveredByValue(tickScale, 3)).toBe(2);
      expect(countTicksCoveredByValue(tickScale, 4)).toBe(3);
    });

    it('returns zero when the range is not valid', () => {
      expect(countTicksCoveredByValue(unevenScale, 3)).toBe(0);
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
