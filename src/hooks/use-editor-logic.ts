import { useCallback, useEffect, type RefObject } from 'react';
import { useStore } from '@/store/useStore';
import { EDITOR_CONSTANTS } from '@/lib/constants';

export const useZoomFit = (
    containerRef: RefObject<HTMLDivElement | null>,
    originalWidth: number,
    originalHeight: number
) => {
    const setZoom = useStore(state => state.setZoom);
    const image = useStore(state => state.image);

    const fitToScreen = useCallback(() => {
        const container = containerRef.current;
        if (container && originalWidth > 0 && originalHeight > 0) {
            const padding = EDITOR_CONSTANTS.EDITOR_PADDING;
            const availableW = container.clientWidth - padding;
            const availableH = container.clientHeight - padding;

            if (availableW > EDITOR_CONSTANTS.MIN_EDITOR_DIMENSION && availableH > EDITOR_CONSTANTS.MIN_EDITOR_DIMENSION) {
                const scale = Math.min(availableW / originalWidth, availableH / originalHeight);
                // Ensure we don't zoom in crazy amounts for tiny images
                const finalScale = scale < 1 ? scale : Math.min(scale, 1);
                setZoom(finalScale);
            }
        }
    }, [originalWidth, originalHeight, setZoom, containerRef]);

    // Robust fit-on-load
    useEffect(() => {
        if (!image) return;

        const container = containerRef.current;
        if (!container) return;

        // Immediate fit attempt
        fitToScreen();

        // Also watch for resize (which happens on mount/layout)
        const observer = new ResizeObserver(() => {
            fitToScreen();
        });
        observer.observe(container);

        return () => observer.disconnect();
    }, [image, fitToScreen, containerRef]);

    return { fitToScreen };
};

export const useKeyboardShortcuts = (fitToScreen: () => void) => {
    const setZoom = useStore(state => state.setZoom);
    const selectedBoxId = useStore(state => state.selectedBoxId);
    const boxes = useStore(state => state.boxes);
    const updateBox = useStore(state => state.updateBox);

    useEffect(() => {
        const handleFitEvent = () => fitToScreen();
        window.addEventListener('redact:zoom-fit', handleFitEvent);

        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Command (Mac) or Control (Windows)
            if (e.metaKey || e.ctrlKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    setZoom((z: number) => Math.min(z + EDITOR_CONSTANTS.ZOOM_STEP, EDITOR_CONSTANTS.MAX_ZOOM));
                }
                if (e.key === '-') {
                    e.preventDefault();
                    setZoom((z: number) => Math.max(z - EDITOR_CONSTANTS.ZOOM_STEP, EDITOR_CONSTANTS.MIN_ZOOM));
                }
                if (e.key === '0') {
                    e.preventDefault();
                    fitToScreen();
                }
                if (e.key === '1') {
                    e.preventDefault();
                    setZoom(1);
                }
            }

            // Arrow keys for selected box movement
            if (selectedBoxId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const box = boxes.find(b => b.id === selectedBoxId);
                if (box) {
                    const step = e.shiftKey ? 10 : 1;
                    let { x, y } = box;

                    if (e.key === 'ArrowUp') y -= step;
                    if (e.key === 'ArrowDown') y += step;
                    if (e.key === 'ArrowLeft') x -= step;
                    if (e.key === 'ArrowRight') x += step;

                    updateBox(selectedBoxId, { x, y });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('redact:zoom-fit', handleFitEvent);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [fitToScreen, setZoom, selectedBoxId, boxes, updateBox]);
};
