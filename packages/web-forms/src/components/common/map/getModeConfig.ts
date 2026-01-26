export const MODES = {
	SELECT: 'select', // Used in Select one from map question type
	LOCATION: 'location', // Used in Geopoint with "maps" appearance
	PLACEMENT: 'placement', // Used in Geopoint with "placement-map" appearance
	DRAW: 'draw', // Used in Geoshape and Geotrace question types
} as const;
export type Mode = (typeof MODES)[keyof typeof MODES];

export interface ModeCapabilities {
	canDeleteFeature: boolean;
	canLoadMultiFeatures: boolean;
	canRemoveCurrentLocation: boolean;
	canSaveCurrentLocation: boolean;
	canSelectFeatureOrVertex: boolean;
	canShowMapOverlay: boolean;
	canShowMapOverlayOnError: boolean;
	canUndoLastChange: boolean;
	canViewProperties: boolean;
}

interface ModeConfig {
	interactions: {
		select: boolean;
		longPress: boolean;
		dragFeature: boolean;
		dragFeatureAndVertex: boolean;
	};
	capabilities: ModeCapabilities;
}

export const getModeConfig = (mode: Mode): ModeConfig => {
	// Default, everything turned off.
	const defaultConfig = {
		interactions: {
			select: false,
			longPress: false,
			dragFeature: false,
			dragFeatureAndVertex: false,
		},
		capabilities: {
			canDeleteFeature: false,
			canLoadMultiFeatures: false,
			canRemoveCurrentLocation: false,
			canSaveCurrentLocation: false,
			canSelectFeatureOrVertex: false,
			canShowMapOverlay: false,
			canShowMapOverlayOnError: false,
			canUndoLastChange: false,
			canViewProperties: false,
		},
	} as const;

	if (mode === MODES.SELECT) {
		return {
			interactions: {
				...defaultConfig.interactions,
				select: true,
			},
			capabilities: {
				...defaultConfig.capabilities,
				canLoadMultiFeatures: true,
				canViewProperties: true,
			},
		};
	}

	if (mode === MODES.LOCATION) {
		return {
			interactions: { ...defaultConfig.interactions },
			capabilities: {
				...defaultConfig.capabilities,
				canRemoveCurrentLocation: true,
				canSaveCurrentLocation: true,
				canShowMapOverlay: true,
				canShowMapOverlayOnError: true,
			},
		};
	}

	if (mode === MODES.PLACEMENT) {
		return {
			interactions: {
				...defaultConfig.interactions,
				longPress: true,
				dragFeature: true,
			},
			capabilities: {
				...defaultConfig.capabilities,
				canRemoveCurrentLocation: true,
				canSaveCurrentLocation: false,
				canShowMapOverlay: true,
			},
		};
	}

	if (mode === MODES.DRAW) {
		return {
			interactions: {
				...defaultConfig.interactions,
				select: true,
				longPress: true,
				dragFeatureAndVertex: true,
			},
			capabilities: {
				...defaultConfig.capabilities,
				canDeleteFeature: true,
				canSelectFeatureOrVertex: true,
				canUndoLastChange: true,
			},
		};
	}

	return defaultConfig;
};
