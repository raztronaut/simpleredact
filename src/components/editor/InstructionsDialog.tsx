import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Info, MousePointer2, BoxSelect, Keyboard, Wand2 } from 'lucide-react'

export const InstructionsDialog = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-stone-400 hover:text-white">
                    <Info className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-stone-900 text-stone-100 border-stone-800 sm:max-w-[425px] w-[calc(100%-2rem)] mx-auto rounded-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>How to use SimpleRedact</DialogTitle>
                    <DialogDescription className="text-stone-400">
                        Securely redact information with these tools.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex gap-4">
                        <div className="bg-stone-800 p-2 rounded-lg h-fit">
                            <MousePointer2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white mb-1">Draw to Redact</h4>
                            <p className="text-sm text-stone-400">Click and drag anywhere on the image to create a redaction box.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-stone-800 p-2 rounded-lg h-fit">
                            <BoxSelect className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white mb-1">Select & Edit</h4>
                            <p className="text-sm text-stone-400">Click a box to select it. Drag corners to resize, or drag the box to move it.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-stone-800 p-2 rounded-lg h-fit">
                            <Keyboard className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white mb-1">Keyboard Shortcuts</h4>
                            <ul className="text-sm text-stone-400 list-disc ml-4 space-y-1">
                                <li><strong>Arrows</strong>: Nudge selection 1px</li>
                                <li><strong>Shift + Arrows</strong>: Nudge selection 10px</li>
                                <li><strong>Backspace/Delete</strong>: Remove selection</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-stone-800 p-2 rounded-lg h-fit">
                            <Wand2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white mb-1">AI Auto-Detect</h4>
                            <p className="text-sm text-stone-400">Use the magic wand button to automatically find PII like emails and phone numbers.</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
