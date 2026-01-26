/**
 * Singleton for geolocation. Ensures a single active geolocation process.
 */
class GeolocationService {
	private static instance: GeolocationService | null = null;
	private activePromise: Promise<string> | null = null;

	public static getInstance(): GeolocationService {
		GeolocationService.instance ??= new GeolocationService();
		return GeolocationService.instance;
	}

	/**
	 * Request the current position.
	 *
	 * @param timeoutSeconds - The maximum time allowed to obtain a location before a TIMEOUT error.
	 * @returns A promise resolving to an ODK geopoint string.
	 */
	public getCurrentPosition(timeoutSeconds = 20): Promise<string> {
		if (this.activePromise) {
			return this.activePromise;
		}

		if (!navigator.geolocation) {
			// TODO: translations
			return Promise.reject(new Error('Geolocation is not supported by this browser.'));
		}

		this.activePromise = new Promise<string>((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(
				(point) => {
					resolve(this.formatGeopoint(point));
					this.teardown();
				},
				(error) => {
					// TODO: translations
					reject(new Error(`Geolocation error (code ${error.code})`));
					this.teardown();
				},
				{ enableHighAccuracy: true, timeout: timeoutSeconds * 1000 }
			);
		});

		return this.activePromise;
	}

	private formatGeopoint(position: GeolocationPosition): string {
		const { latitude, longitude, accuracy } = position.coords;
		const altitude = position.coords.altitude ?? 0;
		return `${latitude} ${longitude} ${altitude} ${accuracy}`;
	}

	public teardown(): void {
		this.activePromise = null;
	}
}

export const geolocationService = GeolocationService.getInstance();
