/**
 * IMPORTANT: vue-konva and CanvasBlock are not statically imported here to enable bundling them into a separate chunk.
 * This prevents unnecessary bloat in the application bundle, reducing initial load times and improving performance.
 */
export const MODES = {
  ANNOTATE: 'annotate',
  DRAW: 'draw',
  SIGNATURE: 'signature',
} as const;

export type CanvasMode = (typeof MODES)[keyof typeof MODES];

export const VALID_CANVAS_MODES: CanvasMode[] = Object.values(MODES);

export interface CanvasModeConfig {
  hasBackgroundImage: boolean;
  hasColorPicker: boolean;
  hasPanToggle: boolean;
  hasZoom: boolean;
  hasInfoDialog: boolean;
  hasUndo: boolean;
  hasDelete: boolean;
  isCompact: boolean;
  hasGuideLines: boolean;
}

const DEFAULT_CONFIG: CanvasModeConfig = {
  hasBackgroundImage: true,
  hasColorPicker: true,
  hasPanToggle: true,
  hasZoom: true,
  hasInfoDialog: true,
  hasUndo: true,
  hasDelete: true,
  isCompact: true,
  hasGuideLines: true,
};

export const getModeConfig = (mode?: CanvasMode): CanvasModeConfig => {
  if (mode === MODES.ANNOTATE) {
    return { ...DEFAULT_CONFIG, isCompact: false, hasGuideLines: false };
  }

  if (mode === MODES.DRAW) {
    return { ...DEFAULT_CONFIG, hasBackgroundImage: false, isCompact: false, hasGuideLines: false };
  }

  if (mode === MODES.SIGNATURE) {
    return {
      ...DEFAULT_CONFIG,
      hasBackgroundImage: false,
      hasColorPicker: false,
      hasPanToggle: false,
      hasZoom: false,
      hasInfoDialog: false,
      hasUndo: false,
    };
  }

  return DEFAULT_CONFIG;
};
