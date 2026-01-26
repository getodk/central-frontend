import { getModeConfig, MODES } from '@/components/common/map/getModeConfig.ts';
import { describe, it, expect } from 'vitest';

describe('getModeConfig', () => {
	it('returns correct config for SELECT mode', () => {
		const config = getModeConfig(MODES.SELECT);

		expect(config).toEqual({
			interactions: {
				select: true,
				longPress: false,
				dragFeature: false,
				dragFeatureAndVertex: false,
			},
			capabilities: {
				canSaveCurrentLocation: false,
				canRemoveCurrentLocation: false,
				canLoadMultiFeatures: true,
				canViewProperties: true,
				canSelectFeatureOrVertex: false,
				canShowMapOverlay: false,
				canShowMapOverlayOnError: false,
				canUndoLastChange: false,
				canDeleteFeature: false,
			},
		});
	});

	it('returns correct config for LOCATION mode', () => {
		const config = getModeConfig(MODES.LOCATION);

		expect(config).toEqual({
			interactions: {
				select: false,
				longPress: false,
				dragFeature: false,
				dragFeatureAndVertex: false,
			},
			capabilities: {
				canSaveCurrentLocation: true,
				canRemoveCurrentLocation: true,
				canLoadMultiFeatures: false,
				canViewProperties: false,
				canSelectFeatureOrVertex: false,
				canShowMapOverlay: true,
				canShowMapOverlayOnError: true,
				canUndoLastChange: false,
				canDeleteFeature: false,
			},
		});
	});

	it('returns correct config for PLACEMENT mode', () => {
		const config = getModeConfig(MODES.PLACEMENT);

		expect(config).toEqual({
			interactions: {
				select: false,
				longPress: true,
				dragFeature: true,
				dragFeatureAndVertex: false,
			},
			capabilities: {
				canSaveCurrentLocation: false,
				canRemoveCurrentLocation: true,
				canLoadMultiFeatures: false,
				canViewProperties: false,
				canSelectFeatureOrVertex: false,
				canShowMapOverlay: true,
				canShowMapOverlayOnError: false,
				canUndoLastChange: false,
				canDeleteFeature: false,
			},
		});
	});

	it('returns correct config for DRAW mode', () => {
		const config = getModeConfig(MODES.DRAW);

		expect(config).toEqual({
			interactions: {
				select: true,
				longPress: true,
				dragFeature: false,
				dragFeatureAndVertex: true,
			},
			capabilities: {
				canSaveCurrentLocation: false,
				canRemoveCurrentLocation: false,
				canLoadMultiFeatures: false,
				canViewProperties: false,
				canSelectFeatureOrVertex: true,
				canShowMapOverlay: false,
				canShowMapOverlayOnError: false,
				canUndoLastChange: true,
				canDeleteFeature: true,
			},
		});
	});

	it('returns default config for unknown mode', () => {
		// @ts-expect-error Testing invalid input
		const config = getModeConfig('unknown');

		expect(config).toEqual({
			interactions: {
				select: false,
				longPress: false,
				dragFeature: false,
				dragFeatureAndVertex: false,
			},
			capabilities: {
				canSaveCurrentLocation: false,
				canRemoveCurrentLocation: false,
				canLoadMultiFeatures: false,
				canViewProperties: false,
				canSelectFeatureOrVertex: false,
				canShowMapOverlay: false,
				canShowMapOverlayOnError: false,
				canUndoLastChange: false,
				canDeleteFeature: false,
			},
		});
	});
});
