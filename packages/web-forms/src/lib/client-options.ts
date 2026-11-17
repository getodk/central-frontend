/**
 * Base map provider for map questions. The host builds it from its own config.
 */
export type MapProvider = { kind: 'google'; apiKey: string } | { kind: 'osm' };

export const DEFAULT_MAP_PROVIDER: MapProvider = { kind: 'osm' };

/**
 * Static, client-only configuration supplied by the host application.
 * Unlike `FormOptions`, nothing here reaches the xforms engine.
 */
export interface ClientOptions {
  readonly mapProvider: MapProvider;
}
