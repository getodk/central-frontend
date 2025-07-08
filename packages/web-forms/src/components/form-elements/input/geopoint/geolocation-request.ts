import type { GeopointValueObject } from './GeopointValueObject.ts';

export const GEOLOCATION_STATUS = {
	PENDING: 'PENDING',
	SUCCESS: 'SUCCESS',
	FAILURE: 'FAILURE',
} as const;

// prettier-ignore
export type GeolocationRequestStatus = typeof GEOLOCATION_STATUS[keyof typeof GEOLOCATION_STATUS];

interface BaseGeolocationRequestState {
	readonly status: GeolocationRequestStatus;
	readonly geopoint: GeopointValueObject | null;
	readonly error: GeolocationPositionError | null;
}

export interface GeolocationRequestPending extends BaseGeolocationRequestState {
	readonly status: typeof GEOLOCATION_STATUS.PENDING;
	// Note: preserved from input
	readonly geopoint: GeopointValueObject | null;
	readonly error: null;
}

export interface GeolocationRequestSuccess extends BaseGeolocationRequestState {
	readonly status: typeof GEOLOCATION_STATUS.SUCCESS;
	readonly geopoint: GeopointValueObject;
	readonly error: null;
}

export interface GeolocationRequestFailure extends BaseGeolocationRequestState {
	readonly status: typeof GEOLOCATION_STATUS.FAILURE;
	readonly geopoint: null;
	readonly error: GeolocationPositionError;
}

// prettier-ignore
export type GeolocationRequestState =
// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| GeolocationRequestPending
	| GeolocationRequestSuccess
	| GeolocationRequestFailure;
