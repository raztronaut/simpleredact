
import { useEffect } from 'react'
import { SummarizeWidget } from 'summarize-with-ai'

export function AIWidget() {
    useEffect(() => {
        // Initialize the widget
        const container = document.getElementById('summarize-widget-container')
        if (container) {
            SummarizeWidget.init({
                target: container,
                theme: 'minimal',
                compact: true,
                mode: 'content',
                promptPrefix: 'Summarize this PII redaction tool page:'
            })
        }
    }, [])

    return (
        <div
            id="summarize-widget-container"
            className="fixed bottom-6 right-6 z-[9999]"
        />
    )
}
