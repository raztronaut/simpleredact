import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { Box } from '@/store/useStore'
import { useStore } from '@/store/useStore'
import type { PIICategory } from '@/lib/aiService'
import { ScanEye, CheckCircle2 } from 'lucide-react'

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

    // Local state to track which categories are selected
    // Initially all true
    // Local state to track which categories are selected
    // Initially all true
    const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {}
        previewBoxes.forEach(box => {
            const cat = box.category || 'DEFAULT'
            initial[cat] = true
        })
        return initial
    })

    const [allCandidates] = useState<Box[]>(() => previewBoxes)

    // We also need to know the mapping of boxes to categories
    // But boxes inside previewBoxes already have 'category' (if we cast them properly or trust the data)
    // The store 'Box' type doesn't explicitly have 'category', but we pushed objects with it.
    // We should probably update the Box type or just cast it here for now.
    // Ideally we update the Box type in store, but TS might complain if we don't.
    // Let's assume we can cast.

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

    // Initialize selection state is now handled by lazy initializers above
    // as the component only mounts when previewBoxes.length > 0

    const handleToggleCategory = (cat: string, checked: boolean) => {
        setSelectedCategories(prev => ({ ...prev, [cat]: checked }))

        // We need to filter the actual displayed boxes in the store if we want real-time preview on canvas?
        // OR we just filter what gets committed?
        // User request: "provide a toggle for each"
        // If we want the canvas to update, we should probably update the store's previewBoxes?
        // But if we update the store, we lose the unchecked ones forever?
        // Better: The store keeps ALL detected boxes in 'previewBoxes'?
        // No, maybe we need 'allDetectedBoxes' and 'visiblePreviewBoxes'?
        // OR: The component manages the filter and updates the "Active Preview" in store?
        // Simpler: The component manages the state of "Selected to Apply".
        // BUT the user asked for "preview step... before a user fully confirms".
        // It would be nice if unchecking a hidden category removes it from the canvas visual.

        // Let's stick to: The STORE holds the "Active Previews".
        // BUT we need to not lose the unchecked ones.
        // So we might need a local ref of "original detected" vs "currently showing".
        // Actually, let's keep it simple: Visuals on canvas are ALL previewBoxes.
        // We only commit the selected ones.
        // Wait, if I uncheck "Emails", I expect them to disappear from the image visually?
        // Yes, that is a better UX.

        // Implementation:
        // 1. We need a separate local state for "All Detected".
        // 2. We update store.previewBoxes whenever selection changes.
    }

    // Better Approach for handling "Uncheck = Disappear from Canvas":
    // We can't easily do that if we overwrite previewBoxes in store.
    // So let's store the "Original Full List" in a ref or state inside this component??
    // No, if the component unmounts or something, we lose it.
    // But this is a Dialog, so it stays mounted while open.

    // Let's try:
    // When `previewBoxes` are first set (entering the mode), we capture them in a local state `allCandidates`.
    // Then we derive the `filteredCandidates` based on toggles.
    // And we call `setPreviewBoxes(filtered)`?
    // BUT if we call setPreviewBoxes, this component re-renders and sees new previewBoxes... loop?
    // We need to distinguish between "Initial Load" and "User Filter update".

    // Alternative: Add `hiddenCategories` to store? No, too complex.
    // Alternative: Add `isActive` or `visible` to Box?

    // Let's go with:
    // The DIALOG holds the "Master List" of what was found.
    // It pushes updates to `previewBoxes` in the store for rendering.

    // Redundant allCandidates state removed, we use the one initialized on mount

    // Removed redundant effect that was syncing store to local candidates

    // Update store when toggles change
    // We need to be careful not to create a loop.
    // We only update store if the resulting list is different from current store.
    useEffect(() => {
        if (allCandidates.length === 0) return

        const filtered = allCandidates.filter(box => {
            const cat = box.category || 'DEFAULT'
            return selectedCategories[cat]
        })

        // Check if different to avoid loop
        // (Simple length check + id check might be enough, or just JSON stringify IDs)
        const currentIds = new Set(previewBoxes.map(b => b.id))
        const newIds = new Set(filtered.map(b => b.id))

        if (currentIds.size !== newIds.size || [...newIds].some(id => !currentIds.has(id))) {
            setPreviewBoxes(filtered)
        }

    }, [selectedCategories, allCandidates, setPreviewBoxes, previewBoxes])


    const handleClose = () => {
        clearPreviewBoxes()
        setSelectedCategories({})
    }

    const handleConfirm = () => {
        commitPreviewBoxes()
        setSelectedCategories({})
    }

    // Re-calculate grouped based on allCandidates for the UI list
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

    // Calculate stats
    const totalSelected = Object.keys(selectedCategories).reduce((acc, cat) => {
        return selectedCategories[cat] ? acc + (grouped[cat]?.length || 0) : acc
    }, 0)

    const sortedCategories = Object.keys(uiGrouped).sort()

    return (
        <Dialog open={true} modal={false} onOpenChange={(open: boolean) => !open && handleClose()}>
            {/* 
              Sidebar Layout: Fixed to the right, full height minus header.
            */}
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
        </Dialog>
    )
}
