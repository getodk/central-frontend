import {
  getRangeRatio,
  getRangeValueAfterSteps,
  getRangeValueAtRatio,
} from '@getodk/web-forms/components/form-elements/range/range-scale.ts';
import { describe, expect, it } from 'vitest';

describe('Range scale', () => {
  const bounds = { start: 0, end: 10, step: 1 };
  const decimalBounds = { start: 0, end: 1, step: 0.1 };
  const reversedBounds = { start: 10, end: 0, step: 2 };
  const unevenBounds = { start: 0, end: 10, step: 3 };

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
      expect(getRangeValueAtRatio(bounds, 0.04)).toBe(0);
      expect(getRangeValueAtRatio(bounds, 0.06)).toBe(1);
      expect(getRangeValueAtRatio(bounds, 0.96)).toBe(10);
    });

    it('returns decimal values without floating point errors', () => {
      expect(getRangeValueAtRatio(decimalBounds, 0.3)).toBe(0.3);
      expect(getRangeValueAtRatio(decimalBounds, 0.7)).toBe(0.7);
    });

    it('returns values from start when start is larger than end', () => {
      expect(getRangeValueAtRatio(reversedBounds, 0)).toBe(10);
      expect(getRangeValueAtRatio(reversedBounds, 0.2)).toBe(8);
      expect(getRangeValueAtRatio(reversedBounds, 1)).toBe(0);
    });

    it('returns the last allowed value when the step does not fit evenly', () => {
      expect(getRangeValueAtRatio(unevenBounds, 1)).toBe(9);
    });

    it('returns start when the step is zero', () => {
      expect(getRangeValueAtRatio({ start: 2, end: 10, step: 0 }, 0.5)).toBe(2);
    });
  });

  describe('getRangeValueAfterSteps', () => {
    it('moves the value by the number of steps', () => {
      expect(getRangeValueAfterSteps(bounds, 5, 1)).toBe(6);
      expect(getRangeValueAfterSteps(bounds, 5, -1)).toBe(4);
      expect(getRangeValueAfterSteps(decimalBounds, 0.2, 1)).toBe(0.3);
    });

    it('moves towards end when start is larger than end', () => {
      expect(getRangeValueAfterSteps(reversedBounds, 8, 1)).toBe(6);
    });

    it('does not move past start or end', () => {
      expect(getRangeValueAfterSteps(bounds, 0, -1)).toBe(0);
      expect(getRangeValueAfterSteps(bounds, 10, 1)).toBe(10);
    });
  });
});
