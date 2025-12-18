import { useLayoutEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { ImageCanvas } from './ImageCanvas'
import { Toolbar } from './Toolbar'
import { ArrowLeft, Download } from 'lucide-react'
import { useZoomFit, useKeyboardShortcuts } from '@/hooks/use-editor-logic'

export const EditorScreen = () => {
    const reset = useStore(state => state.reset)
    const image = useStore(state => state.image)
    const originalWidth = useStore(state => state.originalWidth)
    const originalHeight = useStore(state => state.originalHeight)

    const containerRef = useRef<HTMLDivElement>(null)

    // Extracted logic hooks
    const { fitToScreen } = useZoomFit(containerRef, originalWidth, originalHeight)
    useKeyboardShortcuts(fitToScreen)

    useLayoutEffect(() => {
        if (image) {
            // Verify layout
            fitToScreen()
            // Safety timeout for any transitions
            setTimeout(fitToScreen, 100)
        }
    }, [image, fitToScreen])

    const handleDownload = async () => {
        const canvas = document.createElement('canvas')
        const state = useStore.getState()
        const ctx = canvas.getContext('2d')
        if (!ctx || !state.image) return

        const img = new Image()
        img.src = state.image
        await new Promise(resolve => img.onload = resolve)

        canvas.width = state.originalWidth
        canvas.height = state.originalHeight

        ctx.drawImage(img, 0, 0)

        if (state.pixelatedImage) {
            const pixelImg = new Image()
            pixelImg.src = state.pixelatedImage
            await new Promise(resolve => pixelImg.onload = resolve)

            state.boxes.forEach(box => {
                ctx.save()
                ctx.beginPath()
                ctx.rect(box.x, box.y, box.width, box.height)
                ctx.clip()
                ctx.imageSmoothingEnabled = false
                ctx.drawImage(pixelImg, 0, 0, state.originalWidth, state.originalHeight)
                ctx.restore()
            })
        }

        const link = document.createElement('a')
        link.download = `redacted-${Date.now()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    }

    return (
        <div className="h-screen w-full flex flex-col bg-stone-950 overflow-hidden relative">
            {/* Top Bar */}
            <div className="h-16 border-b border-stone-800 flex items-center justify-between px-6 bg-stone-900 z-50">
                <Button variant="ghost" onClick={reset} className="text-stone-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <Button onClick={handleDownload} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-full px-6">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                </Button>
            </div>

            {/* Canvas Area - Scrollable */}
            <div ref={containerRef} className="flex-1 overflow-auto bg-stone-950 p-12 flex items-center justify-center relative">
                <ImageCanvas />
            </div>

            <Toolbar />
        </div>
    )
}
