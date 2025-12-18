import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { EDITOR_CONSTANTS } from '@/lib/constants'

export interface Box {
    id: string
    x: number
    y: number
    width: number
    height: number
    category?: string
}

interface RedactState {
    image: string | null
    pixelatedImage: string | null
    originalWidth: number
    originalHeight: number

    boxes: Box[]
    selectedBoxId: string | null

    // History for Undo/Redo - keeping it simple: just snapshots of 'boxes'
    history: Box[][]
    historyIndex: number

    zoom: number

    // Actions
    loadImage: (imageUrl: string, pixelatedUrl: string, width: number, height: number) => void
    setZoom: (zoom: number | ((prev: number) => number)) => void

    addBox: (box: Omit<Box, 'id'>) => void
    updateBox: (id: string, changes: Partial<Box>) => void
    deleteBox: (id: string) => void
    duplicateBox: (id: string) => void
    selectBox: (id: string | null) => void

    undo: () => void
    redo: () => void
    reset: () => void

    // Preview state for AI detection review
    previewBoxes: Box[]
    setPreviewBoxes: (boxes: Box[]) => void
    clearPreviewBoxes: () => void
    commitPreviewBoxes: () => void
}

export const useStore = create<RedactState>((set, get) => ({
    image: null,
    pixelatedImage: null,
    originalWidth: 0,
    originalHeight: 0,

    boxes: [],
    selectedBoxId: null,

    history: [[]],
    historyIndex: 0,

    zoom: 1,

    loadImage: (image, pixelatedImage, width, height) => set({
        image,
        pixelatedImage,
        originalWidth: width,
        originalHeight: height,
        boxes: [],
        history: [[]],
        historyIndex: 0,
        zoom: 1 // Reset zoom on new image
    }),

    setZoom: (zoomer) => set((state) => ({
        zoom: typeof zoomer === 'function' ? zoomer(state.zoom) : zoomer
    })),

    addBox: (boxData) => {
        const newBox = { id: uuidv4(), ...boxData }
        const { boxes, history, historyIndex } = get()

        // Slice history if we are in the middle
        const newHistory = history.slice(0, historyIndex + 1)
        const newBoxes = [...boxes, newBox]

        set({
            boxes: newBoxes,
            history: [...newHistory, newBoxes],
            historyIndex: historyIndex + 1,
            selectedBoxId: newBox.id
        })
    },

    updateBox: (id, changes) => {
        const { boxes, history, historyIndex } = get()
        const newBoxes = boxes.map((b) => b.id === id ? { ...b, ...changes } : b)

        // Check if anything actually changed to avoid spamming history (optional but good)
        // For now simple push
        const newHistory = history.slice(0, historyIndex + 1)

        set({
            boxes: newBoxes,
            history: [...newHistory, newBoxes],
            historyIndex: historyIndex + 1
        })
    },

    deleteBox: (id) => {
        const { boxes, history, historyIndex } = get()
        const newBoxes = boxes.filter((b) => b.id !== id)
        const newHistory = history.slice(0, historyIndex + 1)

        set({
            boxes: newBoxes,
            history: [...newHistory, newBoxes],
            historyIndex: historyIndex + 1,
            selectedBoxId: null
        })
    },

    duplicateBox: (id) => {
        const { boxes, history, historyIndex } = get()
        const boxToClone = boxes.find(b => b.id === id)
        if (!boxToClone) return

        const newBox = {
            ...boxToClone,
            id: uuidv4(),
            x: boxToClone.x + EDITOR_CONSTANTS.DUPLICATE_OFFSET,
            y: boxToClone.y + EDITOR_CONSTANTS.DUPLICATE_OFFSET
        }

        const newBoxes = [...boxes, newBox]
        const newHistory = history.slice(0, historyIndex + 1)

        set({
            boxes: newBoxes,
            history: [...newHistory, newBoxes],
            historyIndex: historyIndex + 1,
            selectedBoxId: newBox.id
        })
    },

    selectBox: (id) => set({ selectedBoxId: id }),

    undo: () => {
        const { history, historyIndex } = get()
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1
            set({
                historyIndex: newIndex,
                boxes: history[newIndex]
            })
        }
    },

    redo: () => {
        const { history, historyIndex } = get()
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1
            set({
                historyIndex: newIndex,
                boxes: history[newIndex]
            })
        }
    },

    previewBoxes: [],
    setPreviewBoxes: (boxes) => set({ previewBoxes: boxes }),
    clearPreviewBoxes: () => set({ previewBoxes: [] }),
    commitPreviewBoxes: () => {
        const { previewBoxes, boxes, history, historyIndex } = get()
        if (previewBoxes.length === 0) return

        // Create new boxes with fresh IDs (if needed, but they should already have UUIDs from AI service usually, or we assign them here)
        // However, if we trust the source to provide IDs or we re-assign:
        const newCommittedBoxes = previewBoxes.map(b => ({ ...b, id: b.id || uuidv4() }))

        const newBoxes = [...boxes, ...newCommittedBoxes]
        const newHistory = history.slice(0, historyIndex + 1)

        set({
            boxes: newBoxes,
            previewBoxes: [], // clear previews after commit
            history: [...newHistory, newBoxes],
            historyIndex: historyIndex + 1
        })
    },

    reset: () => set({
        image: null,
        pixelatedImage: null,
        boxes: [],
        previewBoxes: [], // Clear previews on reset
        history: [[]],
        historyIndex: 0
    })
}))
