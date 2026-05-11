export const createGeolocationProvider = (...points: string[]) => {
	let callCount = 0;
	return {
		getLocation: () => {
			const point = points[callCount];
			callCount++;
			return Promise.resolve(point ?? '');
		},
	};
};
