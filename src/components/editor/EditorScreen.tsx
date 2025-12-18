import { useLayoutEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { ImageCanvas } from './ImageCanvas'
import { Toolbar } from './Toolbar'
import { DetectionReviewDialog } from './DetectionReviewDialog'
import { InstructionsDialog } from './InstructionsDialog'
import { ArrowLeft, Download } from 'lucide-react'
import { useZoomFit, useKeyboardShortcuts } from '@/hooks/use-editor-logic'
import { trackEvent } from '@/utils/analytics'

export const EditorScreen = () => {
    const reset = useStore(state => state.reset)
    const image = useStore(state => state.image)
    const originalWidth = useStore(state => state.originalWidth)
    const originalHeight = useStore(state => state.originalHeight)
    const previewBoxes = useStore(state => state.previewBoxes)

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

        trackEvent({
            name: 'download_image',
            props: {
                redactions_count: state.boxes.length,
                file_format: 'png'
            }
        });
    }

    return (
        <div className="h-screen w-full flex flex-col bg-stone-950 overflow-hidden relative">
            {/* Top Bar */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-stone-950/50 backdrop-blur-xl z-50 sticky top-0">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={reset}
                        className="text-stone-400 hover:text-white hover:bg-white/5 h-9 px-3 rounded-xl transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="w-px h-4 bg-white/10 mx-2" />
                    <div data-umami-event="open-instructions">
                        <InstructionsDialog />
                    </div>
                </div>

                {/* Center Title for balance */}
                <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
                    <span className="text-white/20 font-sans font-bold text-xs tracking-[0.3em] uppercase pointer-events-none transition-opacity hover:opacity-40">
                        SimpleRedact
                    </span>
                </div>

                <Button
                    onClick={handleDownload}
                    className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-2xl px-6 h-10 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                </Button>
            </div>

            {/* Canvas Area - No Scroll on Mobile */}
            <div ref={containerRef} className="flex-1 overflow-hidden bg-stone-950 p-4 md:p-12 flex items-center justify-center relative touch-none">
                <ImageCanvas />
            </div>

            <Toolbar />
            {previewBoxes.length > 0 && <DetectionReviewDialog />}
        </div>
    )
}
