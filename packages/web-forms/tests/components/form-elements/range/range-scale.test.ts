import {
  getRangeRatio,
  getRangeScale,
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
