const MAX_DECIMAL_PLACES = 10;

export interface RangeBounds {
  readonly start: number;
  readonly end: number;
  readonly step: number;
}

interface RangeScale {
  readonly factor: number;
  readonly start: number;
  readonly span: number;
  readonly step: number;
  readonly direction: -1 | 1;
  readonly lastStepIndex: number;
}

const getDecimalPlaces = (value: number): number => {
  const places = value.toString().split('.')[1]?.length ?? 0;
  return Math.min(places, MAX_DECIMAL_PLACES);
};

const toWholeNumber = (value: number, factor: number): number => Math.round(value * factor);

export const getRangeScale = (bounds: RangeBounds): RangeScale => {
  const decimalPlaces = Math.max(
    getDecimalPlaces(bounds.start),
    getDecimalPlaces(bounds.end),
    getDecimalPlaces(bounds.step)
  );
  const factor = 10 ** decimalPlaces;
  const start = toWholeNumber(bounds.start, factor);
  const end = toWholeNumber(bounds.end, factor);
  const step = toWholeNumber(bounds.step, factor);
  const span = Math.abs(end - start);

  return {
    factor,
    start,
    span,
    step,
    direction: end < start ? -1 : 1,
    lastStepIndex: step === 0 ? 0 : Math.floor(span / step),
  };
};

const getValueAtStepIndex = (scale: RangeScale, stepIndex: number): number => {
  const index = Math.min(Math.max(stepIndex, 0), scale.lastStepIndex);

  return (scale.start + scale.direction * index * scale.step) / scale.factor;
};

const getNearestStepIndex = (scale: RangeScale, value: number): number => {
  if (scale.step === 0) {
    return 0;
  }

  const distance = (toWholeNumber(value, scale.factor) - scale.start) * scale.direction;
  return Math.round(distance / scale.step);
};

export const getRangeRatio = (bounds: RangeBounds, value: number): number => {
  const span = bounds.end - bounds.start;
  if (span === 0) {
    return 0;
  }

  return (value - bounds.start) / span;
};

export const getRangeValueAtRatio = (scale: RangeScale, ratio: number): number => {
  if (scale.step === 0) {
    return getValueAtStepIndex(scale, 0);
  }

  const distance = ratio * scale.span;
  return getValueAtStepIndex(scale, Math.round(distance / scale.step));
};

// A positive `stepCount` moves towards `end`, a negative one towards `start`.
export const getRangeValueAfterSteps = (
  scale: RangeScale,
  value: number,
  stepCount: number
): number => {
  return getValueAtStepIndex(scale, getNearestStepIndex(scale, value) + stepCount);
};
