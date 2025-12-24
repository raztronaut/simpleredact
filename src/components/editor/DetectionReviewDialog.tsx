import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Box } from '@/store/useStore'
import { useStore } from '@/store/useStore'
import type { PIICategory } from '@/lib/aiService'
import { ScanEye, CheckCircle2, Save, FolderOpen, Loader2, Trash2 } from 'lucide-react'
import { trackEvent } from '@/utils/analytics'
import { useSession } from '@/lib/auth-client'
import { presetsApi, type Preset } from '@/lib/presets'

// Helper to get nice labels for categories
const CATEGORY_LABELS: Record<PIICategory, string> = {
    'EMAIL': 'Emails',
    'PHONE': 'Phone Numbers',
    'CREDIT_CARD': 'Credit Cards',
    'DATE': 'Dates',
    'LINK': 'Links & URLs',
    'NAME': 'Names',
    'ADDRESS': 'Addresses',
    'PRICE': 'Prices',
    'DEFAULT': 'Other Text'
}

export const DetectionReviewDialog = () => {
    const previewBoxes = useStore(state => state.previewBoxes)
    const setPreviewBoxes = useStore(state => state.setPreviewBoxes)
    const commitPreviewBoxes = useStore(state => state.commitPreviewBoxes)
    const clearPreviewBoxes = useStore(state => state.clearPreviewBoxes)

    const { data: session } = useSession()

    const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {}
        previewBoxes.forEach(box => {
            const cat = box.category || 'DEFAULT'
            initial[cat] = true
        })
        return initial
    })

    const [allCandidates] = useState<Box[]>(() => previewBoxes)

    // Preset state
    const [presets, setPresets] = useState<Preset[]>([])
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [presetName, setPresetName] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isLoadingPresets, setIsLoadingPresets] = useState(false)
    const [presetToDelete, setPresetToDelete] = useState<Preset | null>(null)

    // Load presets when user is logged in
    useEffect(() => {
        if (session?.user) {
            setIsLoadingPresets(true)
            presetsApi.list()
                .then(setPresets)
                .catch(console.error)
                .finally(() => setIsLoadingPresets(false))
        }
    }, [session?.user])

    // Group boxes by category
    const grouped = useMemo(() => {
        const groups: Record<string, Box[]> = {}
        previewBoxes.forEach(box => {
            const cat = box.category || 'DEFAULT'
            if (!groups[cat]) groups[cat] = []
            groups[cat].push(box)
        })
        return groups
    }, [previewBoxes])

    const handleToggleCategory = (cat: string, checked: boolean) => {
        setSelectedCategories(prev => ({ ...prev, [cat]: checked }))
    }

    // Update store when toggles change
    useEffect(() => {
        if (allCandidates.length === 0) return

        const filtered = allCandidates.filter(box => {
            const cat = box.category || 'DEFAULT'
            return selectedCategories[cat]
        })

        const currentIds = new Set(previewBoxes.map(b => b.id))
        const newIds = new Set(filtered.map(b => b.id))

        if (currentIds.size !== newIds.size || [...newIds].some(id => !currentIds.has(id))) {
            setPreviewBoxes(filtered)
        }

    }, [selectedCategories, allCandidates, setPreviewBoxes, previewBoxes])

    const handleClose = () => {
        clearPreviewBoxes()
        setSelectedCategories({})
        trackEvent({ name: 'ai_review_cancel' })
    }

    const handleConfirm = () => {
        commitPreviewBoxes()

        const breakdown: Record<string, number> = {}
        Object.keys(grouped).forEach(cat => {
            if (selectedCategories[cat]) {
                breakdown[cat] = grouped[cat].length
            }
        })

        trackEvent({
            name: 'ai_review_confirm',
            props: {
                total_accepted: totalSelected,
                categories: breakdown
            }
        })

        setSelectedCategories({})
    }

    const handleSavePreset = async () => {
        if (!presetName.trim()) return

        setIsSaving(true)
        try {
            const categories = Object.keys(selectedCategories).filter(cat => selectedCategories[cat])
            const newPreset = await presetsApi.create({ name: presetName, categories })
            setPresets(prev => [...prev, newPreset])
            setShowSaveDialog(false)
            setPresetName('')
        } catch (error) {
            console.error('Failed to save preset:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleLoadPreset = (preset: Preset) => {
        const newSelection: Record<string, boolean> = {}
        // First, set all current categories to false
        Object.keys(selectedCategories).forEach(cat => {
            newSelection[cat] = false
        })
        // Then enable the preset categories
        preset.categories.forEach(cat => {
            newSelection[cat] = true
        })
        setSelectedCategories(newSelection)
    }

    const handleDeletePreset = async () => {
        if (!presetToDelete) return

        try {
            await presetsApi.delete(presetToDelete.id)
            setPresets(prev => prev.filter(p => p.id !== presetToDelete.id))
            setPresetToDelete(null)
        } catch (error) {
            console.error('Failed to delete preset:', error)
        }
    }

    const uiGrouped = useMemo(() => {
        const groups: Record<string, Box[]> = {}
        allCandidates.forEach(box => {
            const cat = box.category || 'DEFAULT'
            if (!groups[cat]) groups[cat] = []
            groups[cat].push(box)
        })
        return groups
    }, [allCandidates])

    if (previewBoxes.length === 0 && allCandidates.length === 0) return null

    const totalSelected = Object.keys(selectedCategories).reduce((acc, cat) => {
        return selectedCategories[cat] ? acc + (grouped[cat]?.length || 0) : acc
    }, 0)

    const sortedCategories = Object.keys(uiGrouped).sort()
    const hasSelectedCategories = Object.values(selectedCategories).some(v => v)

    return (
        <Dialog open={true} modal={false} onOpenChange={(open: boolean) => !open && handleClose()}>
            <DialogContent
                hideOverlay
                className="fixed right-0 left-auto top-16 bottom-0 w-full sm:w-80 h-[calc(100vh-64px)] bg-stone-900 text-stone-100 border-l border-stone-800 shadow-2xl p-0 gap-0 sm:rounded-none translate-x-0 translate-y-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right"
                onInteractOutside={(e) => {
                    e.preventDefault()
                }}
            >
                <DialogHeader className="p-6 border-b border-stone-800">
                    <DialogTitle className="flex items-center gap-2">
                        <ScanEye className="w-5 h-5 text-emerald-500" />
                        Review Items
                    </DialogTitle>
                    <DialogDescription className="text-stone-400">
                        Select text to redact.
                    </DialogDescription>
                </DialogHeader>

                {/* Preset Controls - Only for logged in users */}
                {session?.user && (
                    <div className="px-4 py-2 border-b border-stone-800 flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-stone-700 text-stone-300"
                                    disabled={isLoadingPresets || presets.length === 0}
                                >
                                    <FolderOpen className="w-3 h-3 mr-1" />
                                    Load
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-stone-900 border-stone-800">
                                {presets.map(preset => (
                                    <DropdownMenuItem
                                        key={preset.id}
                                        className="text-stone-300 focus:text-white focus:bg-stone-800 flex justify-between group"
                                    >
                                        <span className="flex-1 cursor-pointer" onClick={() => handleLoadPreset(preset)}>
                                            {preset.name}
                                        </span>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-stone-500 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setPresetToDelete(preset)
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-stone-700 text-stone-300"
                            onClick={() => setShowSaveDialog(true)}
                            disabled={!hasSelectedCategories}
                        >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                        </Button>
                    </div>
                )}

                {/* Save Preset Dialog */}
                {showSaveDialog && (
                    <div className="px-4 py-3 border-b border-stone-800 bg-stone-800/50">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Preset name..."
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                className="text-sm"
                                autoFocus
                            />
                            <Button
                                size="sm"
                                onClick={handleSavePreset}
                                disabled={isSaving || !presetName.trim()}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowSaveDialog(false)}
                            >
                                ✕
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-auto p-4">
                    <div className="space-y-3">
                        {sortedCategories.map(cat => (
                            <div key={cat} className="bg-stone-800/50 p-3 rounded-lg border border-stone-700/50">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`cat-${cat}`}
                                        checked={!!selectedCategories[cat]}
                                        onCheckedChange={(c: boolean | 'indeterminate') => handleToggleCategory(cat, c === true)}
                                        className="data-[state=checked]:bg-emerald-500 border-stone-600"
                                    />
                                    <div className="grid gap-1.5 leading-none flex-1">
                                        <label
                                            htmlFor={`cat-${cat}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                                        >
                                            {CATEGORY_LABELS[cat as PIICategory] || cat}
                                        </label>
                                        <p className="text-xs text-stone-500">
                                            {uiGrouped[cat]?.length} items found
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-stone-800 bg-stone-900">
                    <div className="flex flex-col gap-3">
                        <div className="text-xs text-stone-500 font-mono text-center mb-1">
                            {totalSelected} items selected
                        </div>
                        <Button onClick={handleConfirm} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Apply Redactions
                        </Button>
                        <Button variant="ghost" onClick={handleClose} className="w-full hover:bg-red-500/10 hover:text-red-400">
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!presetToDelete} onOpenChange={(open: boolean) => !open && setPresetToDelete(null)}>
                <AlertDialogContent className="bg-stone-900 border-stone-800 text-stone-100">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
                        <AlertDialogDescription className="text-stone-400">
                            Are you sure you want to delete "{presetToDelete?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-stone-700 hover:bg-stone-800 text-stone-300">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePreset}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    )
}
