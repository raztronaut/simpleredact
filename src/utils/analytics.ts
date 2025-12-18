/**
 * Type-safe Umami Analytics Helper
 */

interface TrackEventProps {
    [key: string]: string | number | boolean | object | undefined;
}

type AnalyticsEvent =
    | { name: 'upload_success'; props: { file_type: string; file_size_kb: number } }
    | { name: 'redaction_manual_create'; props: { tool: 'pixelate' | 'blur' | 'blackout' } }
    | { name: 'redaction_delete'; props: { method: 'keyboard' | 'toolbar' } }
    | { name: 'ai_scan_start'; props: { is_mobile: boolean } }
    | { name: 'ai_scan_complete'; props: { results_count: number; duration_ms: number } }
    | { name: 'ai_scan_error'; props: { error_type: string } }
    | { name: 'download_image'; props: { redactions_count: number; file_format: string } }
    | { name: 'zoom_change'; props: { action: 'in' | 'out' | 'fit' | '100' } }
    | { name: 'canvas_reset'; props?: Record<string, never> }
    | { name: 'undo_action'; props?: Record<string, never> }
    | { name: 'redo_action'; props?: Record<string, never> }
    | { name: 'ai_review_confirm'; props: { total_accepted: number; categories: Record<string, number> } }
    | { name: 'ai_review_cancel'; props?: Record<string, never> };

declare global {
    interface Window {
        umami?: {
            track: (eventName: string, eventData?: TrackEventProps) => void;
        };
    }
}

export const trackEvent = (event: AnalyticsEvent) => {
    if (typeof window !== 'undefined' && window.umami) {
        try {
            window.umami.track(event.name, event.props);
        } catch (err) {
            console.warn('Analytics tracking failed:', err);
        }
    } else if (import.meta.env.DEV) {
        // Log to console in development for verification
        console.log(`[Analytics Dev] ${event.name}`, event.props || '');
    }
};
