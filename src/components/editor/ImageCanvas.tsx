import React, { useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { RedactionBox } from './RedactionBox'
import { EDITOR_CONSTANTS } from '@/lib/constants'

export const ImageCanvas = () => {
    const image = useStore(state => state.image)
    const originalWidth = useStore(state => state.originalWidth)
    const originalHeight = useStore(state => state.originalHeight)
    const boxes = useStore(state => state.boxes)
    const selectedBoxId = useStore(state => state.selectedBoxId)
    const zoom = useStore(state => state.zoom)

    const selectBox = useStore(state => state.selectBox)
    const addBox = useStore(state => state.addBox)

    const canvasRef = useRef<HTMLDivElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const dragStartRef = useRef<{ x: number, y: number } | null>(null)

    const handlePointerDown = (e: React.PointerEvent) => {
        // Only start drawing if we are on the background, not on a box
        if ((e.target as HTMLElement).closest('.cursor-move')) return

        e.preventDefault()
        selectBox(null) // Deselect
        setIsDrawing(true)

        // Calculate relative coordinates in the image space
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        // Coords relative to the SCALED element
        const clientX = e.clientX - rect.left
        const clientY = e.clientY - rect.top

        // Convert to UN-SCALED image coords
        const x = clientX / zoom
        const y = clientY / zoom

        dragStartRef.current = { x, y }

        // We create a temporary box visual? Or just wait for mouse up?
        // Let's just wait for mouse up to add it, maybe show a drag selection div.
        // For simplicity 1.0, let's just add a default box on click?
        // User requested: "add boxes on the image... add in a new redact square"
        // And "drag to create" is standard.
        // Let's implement drag-to-create.
    }

    // For drag-to-create, we need local state for the "being drawn" box
    const [drawingBox, setDrawingBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null)

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing || !dragStartRef.current || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const clientX = e.clientX - rect.left
        const clientY = e.clientY - rect.top

        const currX = clientX / zoom
        const currY = clientY / zoom

        const startX = dragStartRef.current.x
        const startY = dragStartRef.current.y

        const x = Math.min(currX, startX)
        const y = Math.min(currY, startY)
        const w = Math.abs(currX - startX)
        const h = Math.abs(currY - startY)

        setDrawingBox({ x, y, w, h })
    }

    const handlePointerUp = () => {
        if (isDrawing && drawingBox) {
            // Only add if it has some size
            if (drawingBox.w > EDITOR_CONSTANTS.MIN_BOX_SIZE && drawingBox.h > EDITOR_CONSTANTS.MIN_BOX_SIZE) {
                addBox({
                    x: drawingBox.x,
                    y: drawingBox.y,
                    width: drawingBox.w,
                    height: drawingBox.h
                })
            }
        }
        setIsDrawing(false)
        setDrawingBox(null)
        dragStartRef.current = null
    }

    if (!image) return null

    return (
        <div
            className="relative shadow-2xl bg-white"
            style={{
                width: originalWidth * zoom,
                height: originalHeight * zoom,
                // Use transform-origin top-left if we were using scale transform
                // But here we might just exact size it.
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Base Image */}
            <div
                ref={canvasRef}
                className="absolute inset-0 origin-top-left"
                style={{
                    width: originalWidth,
                    height: originalHeight,
                    transform: `scale(${zoom})`,
                }}
            >
                <img
                    src={image}
                    alt="Original"
                    className="w-full h-full object-contain pointer-events-none select-none"
                    draggable={false}
                />

                {/* Overlay Layer for Boxes */}
                <div className="absolute inset-0">
                    {boxes.map(box => (
                        <RedactionBox
                            key={box.id}
                            box={box}
                            zoom={zoom}
                            isSelected={selectedBoxId === box.id}
                        />
                    ))}

                    {/* The box currently being drawn */}
                    {drawingBox && (
                        <div
                            className="absolute border-2 border-emerald-500 bg-emerald-500/20"
                            style={{
                                left: drawingBox.x,
                                top: drawingBox.y,
                                width: drawingBox.w,
                                height: drawingBox.h
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
