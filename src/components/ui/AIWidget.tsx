import { useEffect } from 'react'
import { SummarizeWidget } from 'summarize-with-ai'
import { useStore } from '@/store/useStore'

export function AIWidget() {
    const hasImage = useStore(state => !!state.image)

    useEffect(() => {
        if (hasImage) return

        // Initialize the widget
        const container = document.getElementById('summarize-widget-container')
        if (container) {
            SummarizeWidget.init({
                target: container,
                theme: 'minimal',
                compact: true,
                promptPrefix: 'Summarize this PII redaction tool page:'
            })
        }
    }, [hasImage])

    if (hasImage) return null

    return (
        <div
            id="summarize-widget-container"
            className="fixed bottom-6 right-6 z-[9999]"
        />
    )
}
