import React, { useCallback, useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { generatePixelatedVersion } from '@/utils/imageProcessing'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { EDITOR_CONSTANTS } from '@/lib/constants'
import { FeaturesSection } from '@/components/ui/feature'
import { Hero } from './Hero'
import { SiteFooter } from './SiteFooter'

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

            loadImage(objectUrl, pixelatedUrl, img.width, img.height, { type: file.type, size: file.size })
        } catch (error) {
            console.error('Failed to process image', error)
        } finally {
            setIsProcessing(false)
        }
    }, [loadImage])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Only set dragging to false if we're leaving the card itself, 
        // not just moving between children.
        const rect = e.currentTarget.getBoundingClientRect()
        const { clientX, clientY } = e

        if (
            clientX <= rect.left ||
            clientX >= rect.right ||
            clientY <= rect.top ||
            clientY >= rect.bottom
        ) {
            setIsDragging(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
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
        <div className="min-h-screen bg-stone-950 flex flex-col items-center p-4 relative overflow-x-hidden">
            <div className="w-full max-w-6xl mx-auto flex flex-col items-center pt-0 gap-0">

                <Hero />

                <Card
                    className={cn(
                        "w-full max-w-md transition-all duration-500 ease-in-out relative z-10 bg-stone-900/40 backdrop-blur-md border-stone-800 shadow-2xl overflow-hidden group",
                        isDragging
                            ? "border-emerald-500/50 bg-emerald-500/5 scale-[1.01] ring-1 ring-emerald-500/20"
                            : "hover:border-stone-700/50 hover:bg-stone-900/60"
                    )}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <CardHeader className="text-center pb-1 pt-4">
                        <CardTitle className="text-lg font-bold text-white tracking-tight">
                            {isProcessing ? 'Processing Image...' : 'Secure Upload'}
                        </CardTitle>
                        <CardDescription className="text-stone-400 text-[10px]">
                            Your images are processed locally and never leave your browser.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-1">
                        <div
                            className={cn(
                                "relative rounded-xl border border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 p-6",
                                isDragging
                                    ? "border-emerald-500 bg-emerald-500/10"
                                    : "border-stone-800 bg-stone-950/30 group-hover:border-stone-700 group-hover:bg-stone-950/50"
                            )}
                        >
                            <div className="relative scale-90">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
                                <div className="relative p-3 bg-stone-900 rounded-xl border border-stone-800 shadow-inner group-hover:border-stone-700 transition-colors">
                                    {isProcessing ? (
                                        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                    ) : (
                                        <Upload className="w-6 h-6 text-stone-400 group-hover:text-emerald-500 transition-all duration-300 group-hover:scale-110" />
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-0.5">
                                <p className="text-stone-300 text-xs font-medium">
                                    {isDragging ? "Drop your image here" : "Drag and drop your image"}
                                </p>
                                <p className="text-stone-500 text-[8px] uppercase tracking-widest font-semibold">
                                    or
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
                                variant="outline"
                                size="sm"
                                className="px-4 border-stone-700 hover:bg-stone-800 text-stone-200 hover:text-white transition-all duration-300 shadow-lg h-8 text-xs"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                            >
                                <Upload className="w-3 h-3 mr-1.5" />
                                Select File
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <FeaturesSection />
                <SiteFooter />
            </div>
        </div>
    )
}
