/**
 * Static, client-only configuration supplied by the host application.
 * Unlike `FormOptions`, nothing here reaches the xforms engine.
 */
export interface ClientOptions {
  readonly googleMapsKey?: string | undefined;
}
