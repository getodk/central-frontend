import type { RangeTickLabel, TextRange } from '@getodk/xforms-engine';

const MAX_DECIMAL_PLACES = 10;

export interface RangeBounds {
  readonly start: number;
  readonly end: number;
  readonly step: number;
  readonly tickInterval?: number | null;
}

export interface RangeScale {
  readonly factor: number;
  readonly start: number;
  readonly span: number;
  readonly step: number;
  readonly tickInterval: number;
  readonly direction: -1 | 1;
  readonly lastStepIndex: number;
}

export interface RangeTick {
  readonly value: number;
  readonly distance: number;
  readonly ratio: number;
}

export interface PositionedTickLabel {
  readonly ratio: number;
  readonly label: TextRange<'item-label'>;
}

const getDecimalPlaces = (value: number): number => {
  const places = value.toString().split('.')[1]?.length ?? 0;
  return Math.min(places, MAX_DECIMAL_PLACES);
};

const toWholeNumber = (value: number, factor: number): number => Math.round(value * factor);

export const getRangeScale = (bounds: RangeBounds): RangeScale => {
  const tickInterval = bounds.tickInterval ?? 0;
  const decimalPlaces = Math.max(
    getDecimalPlaces(bounds.start),
    getDecimalPlaces(bounds.end),
    getDecimalPlaces(bounds.step),
    getDecimalPlaces(tickInterval)
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
    tickInterval: toWholeNumber(tickInterval, factor),
    direction: end < start ? -1 : 1,
    lastStepIndex: step === 0 ? 0 : Math.floor(span / step),
  };
};

const getValueAtDistance = (scale: RangeScale, distance: number) => {
  const wholeValue = scale.start + scale.direction * distance;
  return wholeValue / scale.factor;
};

const getValueAtStepIndex = (scale: RangeScale, stepIndex: number): number => {
  const index = Math.min(Math.max(stepIndex, 0), scale.lastStepIndex);
  return getValueAtDistance(scale, index * scale.step);
};

const getNearestStepIndex = (scale: RangeScale, value: number): number => {
  if (scale.step === 0) {
    return 0;
  }

  const offset = toWholeNumber(value, scale.factor) - scale.start;
  const distance = offset * scale.direction;
  return Math.round(distance / scale.step);
};

export const getRangeRatio = (scale: RangeScale, value: number): number => {
  if (scale.span === 0) {
    return 0;
  }

  const start = scale.start / scale.factor;
  const span = scale.span / scale.factor;
  const distance = (value - start) * scale.direction;
  return distance / span;
};

export const getRangeStart = (scale: RangeScale): number => getValueAtStepIndex(scale, 0);

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

const getTickGap = (scale: RangeScale) => {
  return isValidTickInterval(scale) ? scale.tickInterval : scale.step;
};

export const getNearestStepDistance = (scale: RangeScale, value: number): number => {
  return getNearestStepIndex(scale, value) * scale.step;
};

export const getRangeValueAtRatio = (scale: RangeScale, ratio: number): number => {
  if (scale.step === 0) {
    return getValueAtStepIndex(scale, 0);
  }

  const distance = ratio * scale.span;
  return getValueAtStepIndex(scale, Math.round(distance / scale.step));
};

export const getRangeTicks = (scale: RangeScale): readonly RangeTick[] => {
  if (!isValidRange(scale)) {
    return [];
  }

  const START_TICK = 1;
  const tickGap = getTickGap(scale);
  const tickCount = START_TICK + scale.span / tickGap;
  return Array.from({ length: tickCount }, (_, index) => {
    const distance = index * tickGap;
    return { value: getValueAtDistance(scale, distance), distance, ratio: distance / scale.span };
  });
};

const isEndTick = ({ ratio }: RangeTick) => ratio === 0 || ratio === 1;

export const placeLabelsOnTicks = (
  ticks: readonly RangeTick[],
  tickLabels: readonly RangeTickLabel[],
  endLabelsOnly: boolean
): readonly PositionedTickLabel[] => {
  const labelsByValue = new Map(
    tickLabels
      .filter((tickLabel) => tickLabel.label.asString.trim().length > 0)
      .map(({ value, label }) => [value, label] as const)
  );
  const ticksToLabel = endLabelsOnly ? ticks.filter((t) => isEndTick(t)) : ticks;

  const labelsToShow: PositionedTickLabel[] = [];
  ticksToLabel.forEach(({ value, ratio }) => {
    const label = labelsByValue.get(value);
    if (label != null) {
      labelsToShow.push({ ratio, label });
    }
  });
  return labelsToShow;
};

// A positive `stepCount` moves towards `end`, a negative one towards `start`.
export const getRangeValueAfterSteps = (
  scale: RangeScale,
  value: number,
  stepCount: number
): number => {
  return getValueAtStepIndex(scale, getNearestStepIndex(scale, value) + stepCount);
};
