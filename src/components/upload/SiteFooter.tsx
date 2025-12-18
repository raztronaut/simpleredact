import { Github, Twitter } from 'lucide-react'

export function SiteFooter() {
    return (
        <footer className="footer-container max-w-6xl mx-auto px-6">
            <div className="flex flex-col items-center justify-between gap-4 border-t border-stone-800 py-12 text-sm text-stone-400 sm:flex-row">
                <span className="font-medium tracking-tight">built by razi</span>
                <div className="flex items-center gap-3">
                    <a
                        href="https://github.com/raztronaut"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                        className="rounded-md p-2 transition-colors hover:bg-white/5 hover:text-white"
                    >
                        <Github size={18} />
                    </a>
                    <a
                        href="https://x.com/raztronaut"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="X (formerly Twitter)"
                        className="rounded-md p-2 transition-colors hover:bg-white/5 hover:text-white"
                    >
                        {/* Twitter icon in Lucide is often just Twitter, but we can use the same size */}
                        <Twitter size={18} />
                    </a>
                </div>
            </div>
        </footer>
    )
}
