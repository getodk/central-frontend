/**
 * IMPORTANT: OpenLayers and MapBlock are not statically imported here to enable bundling them into a separate chunk.
 * This prevents unnecessary bloat in the main application bundle, reducing initial load times and improving performance.
 */

export const MODES = {
	SELECT: 'select', // Used in Select one from map question type
	LOCATION: 'location', // Used in Geopoint with "maps" appearance
	PLACEMENT: 'placement', // Used in Geopoint with "placement-map" appearance
	DRAW: 'draw', // Used in Geoshape and Geotrace question types
} as const;
export type Mode = (typeof MODES)[keyof typeof MODES];

// Used when loading a single feature from the map.
export const SINGLE_FEATURE_TYPES = {
	POINT: 'point',
	SHAPE: 'shape',
	TRACE: 'trace',
} as const;
export type SingleFeatureType = (typeof SINGLE_FEATURE_TYPES)[keyof typeof SINGLE_FEATURE_TYPES];

export interface ModeCapabilities {
	canDeleteFeature: boolean;
	canLoadMultiFeatures: boolean;
	canRemoveCurrentLocation: boolean;
	canSaveCurrentLocation: boolean;
	canSelectFeatureOrVertex: boolean;
	canShowMapOverlay: boolean;
	canShowMapOverlayOnError: boolean;
	canUndoLastChange: boolean;
	canUpdateFeatureCoordinates: boolean;
	canUpdateVertexCoordinates: boolean;
	canViewProperties: boolean;
}

interface ModeConfig {
	interactions: {
		select: boolean;
		tapToAdd: boolean;
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
			tapToAdd: false,
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
			canUpdateFeatureCoordinates: false,
			canUpdateVertexCoordinates: false,
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
				tapToAdd: true,
				dragFeature: true,
			},
			capabilities: {
				...defaultConfig.capabilities,
				canRemoveCurrentLocation: true,
				canSaveCurrentLocation: false,
			},
		};
	}

	if (mode === MODES.DRAW) {
		return {
			interactions: {
				...defaultConfig.interactions,
				select: true,
				tapToAdd: true,
				dragFeatureAndVertex: true,
			},
			capabilities: {
				...defaultConfig.capabilities,
				canDeleteFeature: true,
				canSelectFeatureOrVertex: true,
				canUndoLastChange: true,
				canUpdateFeatureCoordinates: true,
				canUpdateVertexCoordinates: true,
			},
		};
	}

	return defaultConfig;
};
