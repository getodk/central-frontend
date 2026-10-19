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
  readonly span: number; // The distance from start to end.
  readonly step: number;
  readonly tickInterval: number;
  readonly direction: -1 | 1; // -1 when end is smaller than start.
  readonly lastStepIndex: number;
}

export interface RangeTick {
  readonly value: number;
  readonly distance: number; // Distance from start.
  readonly ratio: number; // 0 at start, 1 at end.
}

interface TickLabel {
  readonly ratio: number;
  readonly label: TextRange<'item-label'>;
}

// The space a label can use in grid units.
interface TickLabelSpace extends TickLabel {
  readonly startUnit: number;
  readonly endUnit: number;
}

// The grid lines a label takes, counted from 1 (like CSS grid lines).
export interface PositionedTickLabel extends TickLabel {
  readonly startLine: number;
  readonly endLine: number;
}

export interface TickLabelLayout {
  readonly trackSizes: readonly number[];
  readonly labels: readonly PositionedTickLabel[];
}

export const TRACK_START = 0;
export const TRACK_END = 1;
// Ratios (0 to 1) become whole numbers (0 to 1000) for the grid, because `fr` sizes smaller than 1
// don't fill the grid. Rounding also lets neighbouring labels share a grid line.
const GRID_UNITS = 1000;

export const getDecimalPlaces = (value: number): number => {
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
    return TRACK_START;
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

const isValidPlaceholder = (scale: RangeScale, placeholder: number) => {
  const stepIndex = getNearestStepIndex(scale, placeholder);
  if (stepIndex < 0 || stepIndex > scale.lastStepIndex) {
    return false;
  }

  return getValueAtStepIndex(scale, stepIndex) === placeholder;
};

export const getRangePlaceholder = (
  scale: RangeScale,
  placeholder: number | null
): number | null => {
  if (placeholder == null || !isValidRange(scale) || !isValidPlaceholder(scale, placeholder)) {
    return null;
  }

  return placeholder;
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

const isEndTick = ({ ratio }: RangeTick) => ratio === TRACK_START || ratio === TRACK_END;

// Start and end labels grow inwards, others stay centered on their tick.
const fitLabelBetweenNeighbours = (
  ratio: number,
  prevRatio: number | undefined,
  nextRatio: number | undefined
) => {
  const startRoom = prevRatio == null ? ratio - TRACK_START : (ratio - prevRatio) / 2;
  const endRoom = nextRatio == null ? TRACK_END - ratio : (nextRatio - ratio) / 2;

  if (ratio === TRACK_START) {
    return { start: TRACK_START, end: endRoom };
  }

  if (ratio === TRACK_END) {
    return { start: TRACK_END - startRoom, end: TRACK_END };
  }

  const halfSize = Math.min(startRoom, endRoom);
  return { start: ratio - halfSize, end: ratio + halfSize };
};

const roundToGridUnits = (ratio: number) => Math.round(ratio * GRID_UNITS);

const getLineNumber = (lines: readonly number[], edge: number) => lines.indexOf(edge) + 1;

const getLabelsToShow = (
  ticks: readonly RangeTick[],
  tickLabels: readonly RangeTickLabel[],
  endLabelsOnly: boolean
) => {
  const labelsByValue = new Map(
    tickLabels
      .filter((tickLabel) => tickLabel.label.asString.trim().length > 0)
      .map(({ value, label }) => [value, label] as const)
  );
  const ticksToLabel = endLabelsOnly ? ticks.filter((t) => isEndTick(t)) : ticks;

  const labelsToShow: TickLabel[] = [];
  ticksToLabel.forEach(({ value, ratio }) => {
    const label = labelsByValue.get(value);
    if (label != null) {
      labelsToShow.push({ ratio, label });
    }
  });
  return labelsToShow;
};

const buildGridLayout = (labelSpaces: readonly TickLabelSpace[]): TickLabelLayout => {
  const lines = Array.from(
    new Set([
      0,
      ...labelSpaces.flatMap(({ startUnit, endUnit }) => [startUnit, endUnit]),
      GRID_UNITS,
    ])
  );
  const trackStarts = lines.slice(0, -1);
  const trackEnds = lines.slice(1);
  const trackSizes = trackEnds.map((trackEnd, index) => trackEnd - (trackStarts[index] ?? 0));

  const labels = labelSpaces.map(({ ratio, label, startUnit, endUnit }) => {
    return {
      ratio,
      label,
      startLine: getLineNumber(lines, startUnit),
      endLine: getLineNumber(lines, endUnit),
    };
  });

  return { trackSizes, labels };
};

export const placeLabelsOnTicks = (
  ticks: readonly RangeTick[],
  tickLabels: readonly RangeTickLabel[],
  endLabelsOnly: boolean
): TickLabelLayout => {
  const labelsToShow = getLabelsToShow(ticks, tickLabels, endLabelsOnly);

  const labelSpaces = labelsToShow.map(({ ratio, label }, index) => {
    const { start, end } = fitLabelBetweenNeighbours(
      ratio,
      labelsToShow[index - 1]?.ratio,
      labelsToShow[index + 1]?.ratio
    );
    return { ratio, label, startUnit: roundToGridUnits(start), endUnit: roundToGridUnits(end) };
  });

  return buildGridLayout(labelSpaces);
};

// A positive `stepCount` moves towards `end`, a negative one towards `start`.
export const getRangeValueAfterSteps = (
  scale: RangeScale,
  value: number,
  stepCount: number
): number => {
  return getValueAtStepIndex(scale, getNearestStepIndex(scale, value) + stepCount);
};
