import { Undo2, Redo2, ChevronUp } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { EDITOR_CONSTANTS } from '@/lib/constants'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Toolbar = () => {
    const zoom = useStore(state => state.zoom)
    const setZoom = useStore(state => state.setZoom)
    const undo = useStore(state => state.undo)
    const redo = useStore(state => state.redo)
    const historyIndex = useStore(state => state.historyIndex)
    const history = useStore(state => state.history)

    // We need access to the fit-to-screen logic, which currently lives in EditorScreen.
    // Better to move the "fit" calculation to a store action if we store container dims, 
    // or just pass a handler.
    // However, `useStore` doesn't know about container.
    // But wait, the Toolbar is inside EditorScreen. 
    // I can stick to simple zoom actions here, but the "Fit" action requires context.
    // Let's implement "Fit" by dispatching a custom event that EditorScreen listens to?
    // Or simpler: The Toolbar just triggers `setZoom('fit')`? 
    // Type of `setZoom` expects number or function. 
    // I'll make the store expose a `fitToScreen` handler? No, store doesn't know dims.
    // I'll dispatch a window event `redact:zoom-fit`.

    const handleFit = () => window.dispatchEvent(new Event('redact:zoom-fit'))
    const handle100 = () => setZoom(1)
    const handleZoomIn = () => setZoom(z => Math.min(z + EDITOR_CONSTANTS.ZOOM_STEP, EDITOR_CONSTANTS.MAX_ZOOM))
    const handleZoomOut = () => setZoom(z => Math.max(z - EDITOR_CONSTANTS.ZOOM_STEP, EDITOR_CONSTANTS.MIN_ZOOM))

    const canUndo = historyIndex > 0
    const canRedo = historyIndex < history.length - 1

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-stone-900/90 backdrop-blur-md border border-stone-800 rounded-2xl shadow-2xl z-50">
            <div className="flex items-center gap-1 pr-2 border-r border-stone-800">
                <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-10 w-10 rounded-xl hover:bg-stone-800">
                    <Undo2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-10 w-10 rounded-xl hover:bg-stone-800">
                    <Redo2 className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex items-center gap-1 px-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 px-3 rounded-xl hover:bg-stone-800 gap-2 font-medium tabular-nums min-w-[100px]">
                            {Math.round(zoom * 100)}%
                            <ChevronUp className="w-4 h-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" className="w-48 bg-stone-900 border-stone-800 text-stone-200">
                        <DropdownMenuItem onClick={handleZoomIn}>
                            <span>Zoom In</span>
                            <span className="ml-auto text-xs opacity-50">⌘ +</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleZoomOut}>
                            <span>Zoom Out</span>
                            <span className="ml-auto text-xs opacity-50">⌘ -</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-stone-800" />
                        <DropdownMenuItem onClick={handle100}>
                            <span>Zoom to 100%</span>
                            <span className="ml-auto text-xs opacity-50">⌘ 1</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleFit}>
                            <span>Zoom to Fit</span>
                            <span className="ml-auto text-xs opacity-50">⌘ 0</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
