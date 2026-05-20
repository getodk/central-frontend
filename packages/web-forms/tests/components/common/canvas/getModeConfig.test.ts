import {
	getModeConfig,
	MODES,
	VALID_CANVAS_MODES,
} from '@/components/common/canvas/getModeConfig.ts';
import { describe, it, expect } from 'vitest';

describe('getModeConfig', () => {
	it('returns correct config for ANNOTATE mode', () => {
		const config = getModeConfig(MODES.ANNOTATE);

		expect(config).toEqual({
			hasBackgroundImage: true,
			hasColorPicker: true,
			hasPanToggle: true,
			hasZoom: true,
			hasInfoDialog: true,
			hasUndo: true,
			hasDelete: true,
			isCompact: false,
			hasGuideLines: false,
		});
	});

	it('returns correct config for DRAW mode', () => {
		const config = getModeConfig(MODES.DRAW);

		expect(config).toEqual({
			hasBackgroundImage: false,
			hasColorPicker: true,
			hasPanToggle: true,
			hasZoom: true,
			hasInfoDialog: true,
			hasUndo: true,
			hasDelete: true,
			isCompact: false,
			hasGuideLines: false,
		});
	});

	it('returns correct config for SIGNATURE mode', () => {
		const config = getModeConfig(MODES.SIGNATURE);

		expect(config).toEqual({
			hasBackgroundImage: false,
			hasColorPicker: false,
			hasPanToggle: false,
			hasZoom: false,
			hasInfoDialog: false,
			hasUndo: false,
			hasDelete: true,
			isCompact: true,
			hasGuideLines: true,
		});
	});

	it('returns default config when mode is undefined', () => {
		const config = getModeConfig(undefined);

		expect(config).toEqual({
			hasBackgroundImage: true,
			hasColorPicker: true,
			hasPanToggle: true,
			hasZoom: true,
			hasInfoDialog: true,
			hasUndo: true,
			hasDelete: true,
			isCompact: true,
			hasGuideLines: true,
		});
	});

	it('returns default config for unknown mode', () => {
		// @ts-expect-error Testing invalid input
		const config = getModeConfig('unknown');

		expect(config).toEqual({
			hasBackgroundImage: true,
			hasColorPicker: true,
			hasPanToggle: true,
			hasZoom: true,
			hasInfoDialog: true,
			hasUndo: true,
			hasDelete: true,
			isCompact: true,
			hasGuideLines: true,
		});
	});

	it('exposes VALID_CANVAS_MODES matching MODES values', () => {
		expect(VALID_CANVAS_MODES).toEqual(['annotate', 'draw', 'signature']);
	});
});
