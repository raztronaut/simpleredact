export const EDITOR_CONSTANTS = {
    ZOOM_STEP: 0.1,
    MAX_ZOOM: 3,
    MIN_ZOOM: 0.1,
    PIXELATION_FACTOR: 0.04, // 0.04 = 1/25th of resolution (stronger pixelation)
    EDITOR_PADDING: 96,
    MIN_EDITOR_DIMENSION: 50,
    DUPLICATE_OFFSET: 20,
    MIN_BOX_SIZE: 5,
} as const;
