import React, { useCallback, useRef, useState } from 'react'
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { generatePixelatedVersion } from '@/utils/imageProcessing'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EDITOR_CONSTANTS } from '@/lib/constants'

export const UploadScreen = () => {
    const loadImage = useStore((state) => state.loadImage)
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const processFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) return

        setIsProcessing(true)
        try {
            // Create object URL
            const objectUrl = URL.createObjectURL(file)

            // Get dimensions and pixelated version
            const img = new Image()
            img.src = objectUrl
            await new Promise((resolve) => (img.onload = resolve))

            const pixelatedUrl = await generatePixelatedVersion(objectUrl, EDITOR_CONSTANTS.PIXELATION_FACTOR) // Adjust factor as needed

            loadImage(objectUrl, pixelatedUrl, img.width, img.height)
        } catch (error) {
            console.error('Failed to process image', error)
        } finally {
            setIsProcessing(false)
        }
    }, [loadImage])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        if (e.dataTransfer.files?.[0]) {
            processFile(e.dataTransfer.files[0])
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            processFile(e.target.files[0])
        }
    }

    return (
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
            <div
                className={cn(
                    "w-full max-w-xl p-12 rounded-3xl border-2 border-dashed transition-all duration-300 ease-out flex flex-col items-center gap-6 text-center",
                    isDragging
                        ? "border-emerald-500 bg-emerald-500/10 scale-[1.02]"
                        : "border-stone-800 bg-stone-900/50 hover:border-stone-700 hover:bg-stone-900"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="p-4 bg-stone-800 rounded-2xl shadow-xl">
                    {isProcessing ? (
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-stone-400" />
                    )}
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-white tracking-tight">
                        {isProcessing ? 'Processing Image...' : 'Upload an image'}
                    </h2>
                    <p className="text-stone-400">
                        Drag and drop simply click to browse
                    </p>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />

                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="rounded-full px-8 py-6 text-base font-medium bg-white text-black hover:bg-stone-200 transition-colors"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Image
                </Button>
            </div>
        </div>
    )
}
