import { getModeConfig, MODES } from '@/components/common/map/getModeConfig.ts';
import { describe, it, expect } from 'vitest';

describe('getModeConfig', () => {
	it('returns correct config for SELECT mode', () => {
		const config = getModeConfig(MODES.SELECT);

		expect(config).toEqual({
			interactions: {
				select: true,
				longPress: false,
				drag: false,
			},
			capabilities: {
				canSaveCurrentLocation: false,
				canRemoveCurrentLocation: false,
				canLoadMultiFeatures: true,
				canViewProperties: true,
				canShowMapOverlay: false,
				canShowMapOverlayOnError: false,
			},
		});
	});

	it('returns correct config for LOCATION mode', () => {
		const config = getModeConfig(MODES.LOCATION);

		expect(config).toEqual({
			interactions: {
				select: false,
				longPress: false,
				drag: false,
			},
			capabilities: {
				canSaveCurrentLocation: true,
				canRemoveCurrentLocation: true,
				canLoadMultiFeatures: false,
				canViewProperties: false,
				canShowMapOverlay: true,
				canShowMapOverlayOnError: true,
			},
		});
	});

	it('returns correct config for PLACEMENT mode', () => {
		const config = getModeConfig(MODES.PLACEMENT);

		expect(config).toEqual({
			interactions: {
				select: false,
				longPress: true,
				drag: true,
			},
			capabilities: {
				canSaveCurrentLocation: true,
				canRemoveCurrentLocation: true,
				canLoadMultiFeatures: false,
				canViewProperties: false,
				canShowMapOverlay: true,
				canShowMapOverlayOnError: false,
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
				drag: false,
			},
			capabilities: {
				canSaveCurrentLocation: false,
				canRemoveCurrentLocation: false,
				canLoadMultiFeatures: false,
				canViewProperties: false,
				canShowMapOverlay: false,
				canShowMapOverlayOnError: false,
			},
		});
	});
});
