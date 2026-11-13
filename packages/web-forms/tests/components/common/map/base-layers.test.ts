import { resolveMapProvider } from '@getodk/web-forms/components/common/map/base-layers.ts';
import { describe, expect, it } from 'vitest';

describe('resolveMapProvider', () => {
  it('returns the google provider when a key is configured', () => {
    const provider = resolveMapProvider({ googleMapsKey: 'test-key' });

    expect(provider).toEqual({ kind: 'google', apiKey: 'test-key' });
  });

  it('returns the osm provider when there are no client options', () => {
    expect(resolveMapProvider(undefined)).toEqual({ kind: 'osm' });
  });

  it('returns the osm provider when the key is empty', () => {
    expect(resolveMapProvider({ googleMapsKey: '' })).toEqual({ kind: 'osm' });
  });
});
