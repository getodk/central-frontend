/**
 * Base map provider for map questions. The host builds it from its own config.
 */
export type MapProvider = { name: 'google'; apiKey: string } | { name: 'osm' };

export const DEFAULT_MAP_PROVIDER: MapProvider = { name: 'osm' };

/**
 * Static, client-only configuration supplied by the host application.
 * Unlike `FormOptions`, nothing here reaches the xforms engine.
 */
export interface ClientOptions {
  readonly mapProvider: MapProvider;
}
