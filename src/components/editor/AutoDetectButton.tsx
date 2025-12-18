import { useState } from 'react'
import { Sparkles, Loader2, ScanEye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { aiService } from '@/lib/aiService'
import { useStore } from '@/store/useStore'

export const AutoDetectButton = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'processing'>('idle')
    const [progress, setProgress] = useState(0)
    const [progressText, setProgressText] = useState('')

    const image = useStore(state => state.image)
    const setPreviewBoxes = useStore(state => state.setPreviewBoxes)

    const handleAutoDetect = async () => {
        if (!image) return
        setStatus('loading')

        try {
            // 1. Load Model (downloads if needed)
            await aiService.loadModel((p, text) => {
                setProgress(Math.round(p))
                setProgressText(text)
            })

            // 2. Process Image
            setStatus('processing')
            // Give the UI a moment to update
            await new Promise(resolve => setTimeout(resolve, 100))

            const boxes = await aiService.detectPII(image)

            // 3. Filter results
            // We focus on text regions that are likely sensitive.
            // For now, we take ALL detected text as "potential PII/Text to redact".
            const candidates = boxes.filter(b => b.label && b.label.trim().length > 0)

            if (candidates.length === 0) {
                window.alert("No text detected in this image.")
                return
            }

            // 4. Preview
            // Instead of confirming immediately, we push to preview state.
            // The EditorScreen will render the Review Dialog when previewBoxes is populated.

            const newBoxes = candidates.map(candidate => {
                const [x1, y1, x2, y2] = candidate.box
                return {
                    id: crypto.randomUUID(), // temp ID for preview
                    x: x1,
                    y: y1,
                    width: x2 - x1,
                    height: y2 - y1,
                    category: candidate.category // Pass category along
                }
            })

            setPreviewBoxes(newBoxes)
            // The Dialog in EditorScreen will pick this up and show itself.

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("Auto detect failed:", error)
            window.alert("Failed to auto-detect: " + errorMessage)
        } finally {
            setStatus('idle')
            setProgress(0)
            setProgressText('')
        }
    }

    if (!image) return null

    return (
        <div className="flex items-center gap-2">
            {status === 'idle' ? (
                <Button
                    variant="outline"
                    className="h-10 border-stone-700 bg-stone-900/50 text-stone-200 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
                    onClick={handleAutoDetect}
                >
                    <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
                    Auto Detect
                </Button>
            ) : status === 'loading' ? (
                <Button disabled variant="secondary" className="h-10 min-w-[200px] justify-start px-4 bg-stone-800 text-stone-400 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-300" style={{ width: `${progress}%` }} />
                    <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
                    <span className="truncate text-xs">
                        {progress > 0 ? (progressText || `Loading AI ${progress}%`) : "Initializing AI..."}
                    </span>
                </Button>
            ) : (
                <Button disabled variant="secondary" className="h-10 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <ScanEye className="w-4 h-4 mr-2 animate-pulse" />
                    Scanning Image...
                </Button>
            )}
        </div>
    )
}
