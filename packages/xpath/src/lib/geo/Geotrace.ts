import type { Geopoint } from './Geopoint.ts';
import { geopointCodec } from './geopointCodec.ts';
import { GeotraceLine } from './GeotraceLine.ts';

export interface GeopointValidationResult {
  valid: boolean;
  points?: readonly Geopoint[];
}

export const collectLines = (geopoints: readonly Geopoint[]): readonly GeotraceLine[] => {
  return geopoints.reduce((acc, geopoint, i) => {
    if (i === 0) {
      return acc;
    }

    // Non-null assertion safe: we ensure at least 2 points, and skip index 0.
    const start = geopoints[i - 1]!;
    const end = geopoint;

    acc.push(
      new GeotraceLine({
        start,
        end,
      })
    );

    return acc;
  }, Array<GeotraceLine>());
};

const normalizeInput = (encoded: string): string[] => {
  return (
    encoded
      .trim()
      // Consistency with JavaRosa: any number of trailing semicolons are
      // ignored, with any amount of whitespace between them.
      .replace(/(\s*;)+$/, '')
      .split(/\s*;\s*/)
  );
};

export const validate = (values: readonly string[]): GeopointValidationResult => {
  const [head, ...tail] = values;

  if (head == null) {
    return { valid: false };
  }

  if (tail.length === 0) {
    values = normalizeInput(head);
  }

  const geopoints = values.map((value) => geopointCodec.decodeValue(value));

  if (geopoints.some((point) => point == null)) {
    return { valid: false };
  }

  return { valid: true, points: geopoints as Geopoint[] };
};
