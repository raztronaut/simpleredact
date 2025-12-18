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
import { AutoDetectButton } from './AutoDetectButton'
import { trackEvent } from '@/utils/analytics'

export const Toolbar = () => {
    const zoom = useStore(state => state.zoom)
    const setZoom = useStore(state => state.setZoom)
    const undo = useStore(state => state.undo)
    const redo = useStore(state => state.redo)
    const historyIndex = useStore(state => state.historyIndex)
    const history = useStore(state => state.history)

    const handleFit = () => {
        window.dispatchEvent(new Event('redact:zoom-fit'))
        trackEvent({ name: 'zoom_change', props: { action: 'fit' } })
    }
    const handle100 = () => {
        setZoom(1)
        trackEvent({ name: 'zoom_change', props: { action: '100' } })
    }
    const handleZoomIn = () => {
        setZoom(z => Math.min(z + EDITOR_CONSTANTS.ZOOM_STEP, EDITOR_CONSTANTS.MAX_ZOOM))
        trackEvent({ name: 'zoom_change', props: { action: 'in' } })
    }
    const handleZoomOut = () => {
        setZoom(z => Math.max(z - EDITOR_CONSTANTS.ZOOM_STEP, EDITOR_CONSTANTS.MIN_ZOOM))
        trackEvent({ name: 'zoom_change', props: { action: 'out' } })
    }

    const canUndo = historyIndex > 0
    const canRedo = historyIndex < history.length - 1

    return (
        <div className="fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 md:gap-2 p-1.5 md:p-2 bg-stone-900/90 backdrop-blur-md border border-stone-800 rounded-2xl shadow-2xl z-50 max-w-[95vw] overflow-x-auto">
            <div className="flex items-center gap-0.5 md:gap-1 pr-1 md:pr-2 border-r border-stone-800">
                <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-9 w-9 md:h-10 md:w-10 rounded-xl hover:bg-stone-800" data-umami-event="undo-action">
                    <Undo2 className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-9 w-9 md:h-10 md:w-10 rounded-xl hover:bg-stone-800" data-umami-event="redo-action">
                    <Redo2 className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
            </div>

            <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2 border-r border-stone-800">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 md:h-10 px-2 md:px-3 rounded-xl hover:bg-stone-800 gap-1.5 md:gap-2 font-medium tabular-nums min-w-[80px] md:min-w-[100px] text-xs md:text-sm">
                            {Math.round(zoom * 100)}%
                            <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-50" />
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

            <div className="flex items-center gap-1 pl-1 md:pl-2">
                <AutoDetectButton />
            </div>
        </div>
    )
}
