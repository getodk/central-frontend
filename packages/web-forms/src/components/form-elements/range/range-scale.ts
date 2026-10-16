const MAX_DECIMAL_PLACES = 10;

export interface RangeBounds {
  readonly start: number;
  readonly end: number;
  readonly step: number;
  readonly tickInterval?: number | null;
}

interface RangeScale {
  readonly factor: number;
  readonly start: number;
  readonly span: number;
  readonly step: number;
  readonly tickInterval: number;
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
    getDecimalPlaces(bounds.step),
    getDecimalPlaces(bounds.tickInterval ?? 0)
  );
  const factor = 10 ** decimalPlaces;
  const start = toWholeNumber(bounds.start, factor);
  const end = toWholeNumber(bounds.end, factor);
  const step = toWholeNumber(bounds.step, factor);
  const span = Math.abs(end - start);
  const tickInterval = toWholeNumber(bounds.tickInterval ?? 0, factor);

  return {
    factor,
    start,
    span,
    step,
    tickInterval,
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

const isValidRange = ({ span, step }: RangeScale) => {
  return step !== 0 && span > 0 && span % step === 0;
};

const isValidTickInterval = ({ span, step, tickInterval }: RangeScale) => {
  return (
    tickInterval > 0 &&
    tickInterval <= span &&
    tickInterval % step === 0 &&
    span % tickInterval === 0
  );
};

// Same rules as Collect: no ticks for an invalid range, and an invalid tick interval is ignored.
const countTicksWithinDistance = (scale: RangeScale, distance: number): number => {
  if (!isValidRange(scale)) {
    return 0;
  }

  const tickGap = isValidTickInterval(scale) ? scale.tickInterval : scale.step;
  const START_TICK = 1;
  return START_TICK + Math.floor(distance / tickGap);
};

export const getRangeTickCount = (scale: RangeScale): number => {
  return countTicksWithinDistance(scale, scale.span);
};

export const countTicksCoveredByValue = (scale: RangeScale, value: number): number => {
  const distanceFromStart = getNearestStepIndex(scale, value) * scale.step;
  return countTicksWithinDistance(scale, distanceFromStart);
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
