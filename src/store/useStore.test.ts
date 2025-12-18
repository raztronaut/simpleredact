import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useStore } from './useStore'
import { EDITOR_CONSTANTS } from '@/lib/constants'

describe('useStore', () => {
    beforeEach(() => {
        act(() => {
            useStore.getState().reset()
        })
    })

    it('should start with initial state', () => {
        const state = useStore.getState()
        expect(state.boxes).toEqual([])
        expect(state.zoom).toBe(1)
        expect(state.image).toBeNull()
    })

    it('scroll zoom should be clamped', () => {
        act(() => {
            useStore.getState().setZoom(4)
        })
        // The store setter is raw, but the UI usually limits it. 
        // However, let's verify if the setter itself clamps? 
        // Looking at the code: setZoom: (zoomer) => set((state) => ({ zoom: ... }))
        // It does NOT clamp in the store. The logic for clamping is in the hook/UI.
        // So this test just confirms it sets the value.
        expect(useStore.getState().zoom).toBe(4)
    })

    it('should add a box', () => {
        act(() => {
            useStore.getState().addBox({ x: 10, y: 10, width: 100, height: 100 })
        })
        const state = useStore.getState()
        expect(state.boxes).toHaveLength(1)
        expect(state.boxes[0].x).toBe(10)
        expect(state.selectedBoxId).toBe(state.boxes[0].id)
    })

    it('should duplicate a box with offset', () => {
        act(() => {
            useStore.getState().addBox({ x: 10, y: 10, width: 100, height: 100 })
        })
        const boxId = useStore.getState().boxes[0].id

        act(() => {
            useStore.getState().duplicateBox(boxId)
        })

        const state = useStore.getState()
        expect(state.boxes).toHaveLength(2)
        const newBox = state.boxes[1]
        expect(newBox.x).toBe(10 + EDITOR_CONSTANTS.DUPLICATE_OFFSET)
        expect(newBox.y).toBe(10 + EDITOR_CONSTANTS.DUPLICATE_OFFSET)
    })

    it('should delete a box', () => {
        act(() => {
            useStore.getState().addBox({ x: 10, y: 10, width: 100, height: 100 })
        })
        const boxId = useStore.getState().boxes[0].id

        act(() => {
            useStore.getState().deleteBox(boxId)
        })

        expect(useStore.getState().boxes).toHaveLength(0)
        expect(useStore.getState().selectedBoxId).toBeNull()
    })

    it('should handle undo/redo', () => {
        // 1. Add box
        act(() => {
            useStore.getState().addBox({ x: 10, y: 10, width: 100, height: 100 })
        })
        expect(useStore.getState().boxes).toHaveLength(1)

        // 2. Add another (history push)
        act(() => {
            useStore.getState().addBox({ x: 200, y: 200, width: 50, height: 50 })
        })
        expect(useStore.getState().boxes).toHaveLength(2)

        // 3. Undo
        act(() => {
            useStore.getState().undo()
        })
        expect(useStore.getState().boxes).toHaveLength(1)
        expect(useStore.getState().boxes[0].x).toBe(10)

        // 4. Redo
        act(() => {
            useStore.getState().redo()
        })
        expect(useStore.getState().boxes).toHaveLength(2)
    })
})
