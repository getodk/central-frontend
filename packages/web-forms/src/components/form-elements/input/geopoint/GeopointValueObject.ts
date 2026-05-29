// Considers browser's raw GeolocationCoordinates, where altitude and accuracy can be null.
export interface GeopointValueObject {
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude: number | null;
  readonly accuracy: number | null;
}
