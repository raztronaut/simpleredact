import { useState } from 'react'
import { Sparkles, Loader2, ScanEye, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { aiService } from '@/lib/aiService'
import { useStore } from '@/store/useStore'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export const AutoDetectButton = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'warning'>('idle')
    const [progress, setProgress] = useState(0)
    const [progressText, setProgressText] = useState('')

    const image = useStore(state => state.image)
    const setPreviewBoxes = useStore(state => state.setPreviewBoxes)
    const isMobile = aiService.isMobile()

    const handleAutoDetect = async () => {
        if (!image) return

        // Show warning on mobile before starting
        if (isMobile && status === 'idle') {
            setStatus('warning')
            return
        }

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
            const candidates = boxes.filter(b => b.label && b.label.trim().length > 0)

            if (candidates.length === 0) {
                window.alert("No text detected in this image.")
                return
            }

            // 4. Preview
            const newBoxes = candidates.map(candidate => {
                const [x1, y1, x2, y2] = candidate.box
                return {
                    id: crypto.randomUUID(),
                    x: x1,
                    y: y1,
                    width: x2 - x1,
                    height: y2 - y1,
                    category: candidate.category
                }
            })

            setPreviewBoxes(newBoxes)

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

    // Wrap the return in a fragment to include the Dialog
    return (
        <div className="flex items-center gap-2">
            {image && (
                <>
                    {status === 'idle' ? (
                        <Button
                            variant="outline"
                            className="h-10 border-stone-700 bg-stone-900/50 text-stone-200 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/50 transition-all font-medium"
                            onClick={handleAutoDetect}
                        >
                            <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
                            Auto Detect
                            {isMobile && <span className="ml-1 text-[10px] opacity-50 font-normal">(Beta)</span>}
                        </Button>
                    ) : status === 'loading' ? (
                        <Button disabled variant="secondary" className="h-10 min-w-[200px] justify-start px-4 bg-stone-800 text-stone-400 relative overflow-hidden ring-1 ring-stone-700">
                            <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-300" style={{ width: `${progress}%` }} />
                            <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0 text-emerald-500" />
                            <span className="truncate text-xs">
                                {progress > 0 ? (progressText || `Loading AI ${progress}%`) : "Initializing AI..."}
                            </span>
                        </Button>
                    ) : (
                        <Button disabled variant="secondary" className="h-10 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 ring-1 ring-emerald-500/30">
                            <ScanEye className="w-4 h-4 mr-2 animate-pulse" />
                            Scanning Image...
                        </Button>
                    )}

                    <Dialog open={status === 'warning'} onOpenChange={(open) => !open && setStatus('idle')}>
                        <DialogContent className="bg-stone-900 text-stone-100 border-stone-800 sm:max-w-[425px] w-[calc(100%-2rem)] mx-auto rounded-3xl p-6">
                            <DialogHeader className="text-center pt-2">
                                <DialogTitle className="text-2xl font-serif tracking-tight">Desktop Only Feature</DialogTitle>
                                <DialogDescription className="text-stone-400 text-sm mt-1">
                                    AI detection is optimized for desktop performance.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-6 border-t border-b border-stone-800/50 my-2">
                                <div className="flex gap-4">
                                    <div className="bg-stone-800/80 p-2.5 rounded-xl h-fit border border-stone-700/50">
                                        <Monitor className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white mb-1">High Performance AI</h4>
                                        <p className="text-xs text-stone-400 leading-relaxed">
                                            The model requires significant memory and processing power that most mobile browsers currently limit for stability.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="bg-stone-800/80 p-2.5 rounded-xl h-fit border border-stone-700/50">
                                        <ScanEye className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white mb-1">Manual Redaction Available</h4>
                                        <p className="text-xs text-stone-400 leading-relaxed">
                                            You can still manually draw redaction boxes and edit them perfectly on this device.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pt-2">
                                <Button
                                    className="bg-stone-100 hover:bg-white text-stone-950 font-bold rounded-2xl px-12 h-11 transition-all"
                                    onClick={() => setStatus('idle')}
                                >
                                    Got it
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    )
}
