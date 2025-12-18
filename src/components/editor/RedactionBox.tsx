import { useRef, useState } from 'react'
import type { Box } from '@/store/useStore'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { X, Copy } from 'lucide-react'
import { EDITOR_CONSTANTS } from '@/lib/constants'

interface RedactionBoxProps {
    box: Box
    zoom: number
    isSelected: boolean
}

export const RedactionBox = ({ box, zoom, isSelected }: RedactionBoxProps) => {
    const { x, y, width, height, id } = box
    const pixelatedImage = useStore(state => state.pixelatedImage)
    const originalWidth = useStore(state => state.originalWidth)
    const originalHeight = useStore(state => state.originalHeight)

    const updateBox = useStore(state => state.updateBox)
    const selectBox = useStore(state => state.selectBox)
    const deleteBox = useStore(state => state.deleteBox)
    const duplicateBox = useStore(state => state.duplicateBox)
    const addBox = useStore(state => state.addBox)

    // We track the *interaction* state locally.
    const [interactionState, setInteractionState] = useState<Box | null>(null)

    // We track if we are currently "cloning" (Alt-Drag) to render the ghost
    const [isCloning, setIsCloning] = useState(false)

    // The box to render is either the interaction state or the prop state
    const renderedBox = interactionState || box

    // Ref to hold the latest interaction state for committing
    const interactionRef = useRef<Box | null>(null)

    // Ref to track clone state for event handlers (avoid stale closures)
    const isCloningRef = useRef(false)

    // Calculate inverse scale to keep UI elements constant size
    const uiScale = 1 / zoom

    // Memoize background style to avoid recalculation
    const getBackgroundStyle = (boxX: number, boxY: number) => ({
        backgroundImage: pixelatedImage ? `url(${pixelatedImage})` : undefined,
        backgroundPosition: `-${boxX}px -${boxY}px`,
        backgroundSize: `${originalWidth}px ${originalHeight}px`,
        imageRendering: 'pixelated' as const
    })

    // --- Handlers ---

    const onDragStart = (e: React.PointerEvent) => {
        e.stopPropagation(); e.preventDefault();
        if ((e.target as HTMLElement).closest('button')) return

        selectBox(id);

        const isAlt = e.altKey || e.metaKey
        setIsCloning(isAlt)
        isCloningRef.current = isAlt

        const initial = { x, y, width, height, id }
        setInteractionState(initial)
        interactionRef.current = initial

        const startX = e.clientX
        const startY = e.clientY

        const onMove = (ev: PointerEvent) => {
            const dx = (ev.clientX - startX) / zoom
            const dy = (ev.clientY - startY) / zoom
            const next = { ...initial, x: initial.x + dx, y: initial.y + dy }
            setInteractionState(next)
            interactionRef.current = next
        }

        const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)

            if (interactionRef.current) {
                if (isCloningRef.current) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { id: _id, ...newBoxData } = interactionRef.current
                    addBox(newBoxData)
                } else {
                    updateBox(id, interactionRef.current)
                }
            }
            setInteractionState(null)
            setIsCloning(false)

            interactionRef.current = null
            isCloningRef.current = false
        }

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
    }

    const onResizeStart = (e: React.PointerEvent, handle: string) => {
        e.stopPropagation(); e.preventDefault(); selectBox(id);

        const initial = { x, y, width, height, id }
        setInteractionState(initial)
        interactionRef.current = initial

        const startX = e.clientX
        const startY = e.clientY

        const onMove = (ev: PointerEvent) => {
            const dx = (ev.clientX - startX) / zoom
            const dy = (ev.clientY - startY) / zoom

            let { x: nx, y: ny, width: nw, height: nh } = initial

            if (handle.includes('e')) nw = Math.max(EDITOR_CONSTANTS.MIN_BOX_SIZE, initial.width + dx)
            if (handle.includes('w')) {
                const w = Math.max(EDITOR_CONSTANTS.MIN_BOX_SIZE, initial.width - dx)
                nx = initial.x + (initial.width - w)
                nw = w
            }
            if (handle.includes('s')) nh = Math.max(EDITOR_CONSTANTS.MIN_BOX_SIZE, initial.height + dy)
            if (handle.includes('n')) {
                const h = Math.max(EDITOR_CONSTANTS.MIN_BOX_SIZE, initial.height - dy)
                ny = initial.y + (initial.height - h)
                nh = h
            }

            const next = { ...initial, x: nx, y: ny, width: nw, height: nh }
            setInteractionState(next)
            interactionRef.current = next
        }

        const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            if (interactionRef.current) updateBox(id, interactionRef.current)
            setInteractionState(null)
            interactionRef.current = null
        }

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
    }

    const handleStyle = {
        width: `${12}px`,
        height: `${12}px`,
        transform: `scale(${uiScale})`,
        transformOrigin: 'center',
    }

    return (
        <>
            {/* Ghost of the original box when cloning */}
            {interactionState && isCloning && (
                <div
                    className="absolute z-0 opacity-50 pointer-events-none border border-emerald-500/30"
                    style={{
                        left: box.x,
                        top: box.y,
                        width: box.width,
                        height: box.height,
                        ...getBackgroundStyle(box.x, box.y)
                    }}
                />
            )}

            <div
                className={cn(
                    "absolute cursor-move group touch-none",
                    isSelected ? "z-20" : "z-10 hover:z-20"
                )}
                style={{
                    left: renderedBox.x,
                    top: renderedBox.y,
                    width: renderedBox.width,
                    height: renderedBox.height,
                    // Apply background directly to the main container, simplified structure
                    ...getBackgroundStyle(renderedBox.x, renderedBox.y)
                }}
                onPointerDown={onDragStart}
            >
                {/* Border effect container */}
                <div className={cn(
                    "absolute inset-0 transition-colors pointer-events-none",
                    isSelected ? "border-2 border-emerald-500" : "border border-emerald-500/0 group-hover:border-emerald-500/50"
                )} />

                {isSelected && (
                    <>
                        <div
                            onPointerDown={(e) => onResizeStart(e, 'nw')}
                            className="absolute -left-1.5 -top-1.5 bg-white border border-emerald-500 rounded-full cursor-nw-resize z-50 flex items-center justify-center shadow-sm"
                            style={handleStyle}
                        />
                        <div
                            onPointerDown={(e) => onResizeStart(e, 'ne')}
                            className="absolute -right-1.5 -top-1.5 bg-white border border-emerald-500 rounded-full cursor-ne-resize z-50 shadow-sm"
                            style={handleStyle}
                        />
                        <div
                            onPointerDown={(e) => onResizeStart(e, 'sw')}
                            className="absolute -left-1.5 -bottom-1.5 bg-white border border-emerald-500 rounded-full cursor-sw-resize z-50 shadow-sm"
                            style={handleStyle}
                        />
                        <div
                            onPointerDown={(e) => onResizeStart(e, 'se')}
                            className="absolute -right-1.5 -bottom-1.5 bg-white border border-emerald-500 rounded-full cursor-se-resize z-50 shadow-sm"
                            style={handleStyle}
                        />

                        <div
                            className="absolute left-1/2 -translate-x-1/2 bg-stone-900 rounded-lg shadow-xl border border-stone-700 flex items-center p-1.5 gap-1 z-50 animate-in fade-in slide-in-from-bottom-2 origin-bottom"
                            style={{
                                transform: `translateX(-50%) scale(${uiScale})`,
                                bottom: `calc(100% + ${8 * uiScale}px)`,
                                left: '50%'
                            }}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); duplicateBox(id) }}
                                className="p-2 hover:bg-stone-800 rounded text-stone-300 hover:text-white transition-colors"
                                title="Duplicate"
                            >
                                <Copy size={16} />
                            </button>
                            <div className="w-px h-4 bg-stone-700 mx-1" />
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteBox(id) }}
                                className="p-2 hover:bg-rose-500/20 rounded text-rose-400 hover:text-rose-500 transition-colors"
                                title="Delete"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
